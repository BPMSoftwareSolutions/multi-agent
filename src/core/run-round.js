// warehouse:file
// responsibility: Orchestrates a single round of agent-driven planning and review with artifact state transitions
// actor: orchestration
// role: round_execution
// source_truth: implementation

const {
  buildIntentPrompt,
  buildBuilderPrompt,
  buildReviewerPrompt
} = require("./prompt-builders");
const { callClaudeWithRetry } = require("./llm-client");
const { STAGES } = require("./stages");
const { queueActionRecommendations } = require("../shared/actions");

function normalizeReviewerOutput(output, fallbackArtifact) {
  return {
    intent_issues: Array.isArray(output.intent_issues) ? output.intent_issues : [],
    complexity_issues: Array.isArray(output.complexity_issues) ? output.complexity_issues : [],
    validity_issues: Array.isArray(output.validity_issues) ? output.validity_issues : [],
    change_summary: Array.isArray(output.change_summary) ? output.change_summary : [],
    suggested_artifact: output.suggested_artifact || fallbackArtifact,
    action_recommendations: Array.isArray(output.action_recommendations)
      ? output.action_recommendations.filter((entry) => entry && typeof entry === "object")
      : []
  };
}

async function normalizeIntent(brief, apiKey) {
  const intentPrompt = buildIntentPrompt({ brief });
  try {
    const intent = await callClaudeWithRetry({
      system: intentPrompt.system,
      userMessages: intentPrompt.messages,
      maxTokens: 1024,
      apiKey
    });
    return intent;
  } catch (error) {
    console.error("Failed to normalize intent:", error.message);
    return {
      task_definition: brief,
      success_criteria: [],
      constraints: [],
      open_questions: []
    };
  }
}

async function runRound({
  session,
  apiKey,
  humanInterjection = ""
}) {
  const stageId = session.currentStage;
  const stageConfig = STAGES[stageId];
  const stageState = session.stages[stageId];

  if (!stageConfig || !stageState) {
    throw new Error(`Invalid stage: ${stageId}`);
  }

  const lastRound = stageState.rounds[stageState.rounds.length - 1] || null;
  const roundNumber = stageState.rounds.length + 1;
  const artifactBefore = JSON.parse(JSON.stringify(stageState.artifact));

  // Determine max tokens based on stage (ASCII and plan need more for detailed content)
  const maxTokensByStage = {
    idea: 4096,
    ascii: 8192,
    plan: 8192
  };
  const maxTokens = maxTokensByStage[stageId] || 4096;

  // Planner
  const builderPrompt = buildBuilderPrompt({
    stage: stageConfig,
    intent: session.intent,
    artifact: stageState.artifact,
    lastRound,
    humanInterjection,
    brief: session.brief,
    roundNumber
  });

  const builderStart = Date.now();
  const builderOutput = await callClaudeWithRetry({
    system: builderPrompt.system,
    userMessages: builderPrompt.messages,
    maxTokens,
    apiKey
  });
  const builderDurationMs = Date.now() - builderStart;

  // Reviewer
  const reviewerPrompt = buildReviewerPrompt({
    stage: stageConfig,
    intent: session.intent,
    artifact: stageState.artifact,
    builderOutput,
    humanInterjection
  });

  const reviewerStart = Date.now();
  const reviewerRaw = await callClaudeWithRetry({
    system: reviewerPrompt.system,
    userMessages: reviewerPrompt.messages,
    maxTokens,
    apiKey
  });
  const reviewerDurationMs = Date.now() - reviewerStart;

  const reviewerOutput = normalizeReviewerOutput(reviewerRaw, builderOutput);

  // Store round
  const round = {
    roundNumber,
    timestamp: new Date().toISOString(),
    humanInterjection,
    artifactBefore,
    planner: { artifact: builderOutput, durationMs: builderDurationMs },
    reviewer: { ...reviewerOutput, durationMs: reviewerDurationMs },
    artifactAfter: reviewerOutput.suggested_artifact
  };

  stageState.rounds.push(round);
  stageState.proposedArtifact = reviewerOutput.suggested_artifact;

  return { roundNumber, round, stageState };
}

async function acceptArtifact(session) {
  const stageId = session.currentStage;
  const stageState = session.stages[stageId];

  if (!stageState.proposedArtifact) {
    throw new Error("No proposed artifact to accept");
  }

  stageState.artifact = JSON.parse(JSON.stringify(stageState.proposedArtifact));
  stageState.proposedArtifact = null;
  stageState.accepted = true;

  const latestRound = stageState.rounds[stageState.rounds.length - 1] || null;
  const queueSummary = queueActionRecommendations(
    session,
    latestRound && latestRound.reviewer ? latestRound.reviewer.action_recommendations : [],
    {
      stageId,
      roundNumber: latestRound ? latestRound.roundNumber : null,
      approvedBy: "reviewer+human_accept"
    }
  );

  return {
    artifact: stageState.artifact,
    queueSummary
  };
}

async function advanceStage(session) {
  const { STAGE_ORDER } = require("./stages");
  const currentIndex = STAGE_ORDER.indexOf(session.currentStage);

  if (currentIndex === -1 || currentIndex >= STAGE_ORDER.length - 1) {
    throw new Error("Cannot advance from the final stage");
  }

  if (!session.stages[session.currentStage].accepted) {
    throw new Error("Current stage artifact must be accepted before advancing");
  }

  const nextStageId = STAGE_ORDER[currentIndex + 1];
  session.currentStage = nextStageId;

  return nextStageId;
}

module.exports = {
  normalizeIntent,
  runRound,
  acceptArtifact,
  advanceStage
};
