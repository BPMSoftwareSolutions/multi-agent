// warehouse:file
// responsibility: Executes design workshop rounds with planner and reviewer agents
// actor: orchestration
// role: round_execution
// source_truth: implementation

const {
  buildBuilderPrompt,
  buildReviewerPrompt
} = require("../prompt-builders");
const { callClaudeWithRetry } = require("../llm-client");
const { STAGES } = require("../stages");
const { normalizeReviewerOutput } = require("./intent-normalizer");

// warehouse:method
// responsibility: Executes design workshop round by invoking planner and reviewer agents sequentially, orchestrating prompts and storing round results
// actor: orchestration
// role: round_execution
// source_truth: implementation
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

module.exports = {
  runRound
};
