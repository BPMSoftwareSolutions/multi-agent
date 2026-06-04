// warehouse:file
// responsibility: Orchestrates design workshop round: determines max tokens, executes planner and reviewer sequentially, records artifacts and metrics
// actor: core_runtime
// role: orchestrator
// source_truth: implementation

const { STAGES } = require("../stages");
const { executePlanner } = require("./planner-executor");
const { executeReviewer } = require("./reviewer-executor");

// warehouse:method
// responsibility: Orchestrates design workshop round: determines max tokens, executes planner and reviewer sequentially, records artifacts and metrics
// actor: method_implementation
// role: implementation
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
  const { builderOutput, builderDurationMs } = await executePlanner({
    stageConfig,
    session,
    stageState,
    roundNumber,
    maxTokens,
    apiKey
  });

  // Reviewer
  const { reviewerOutput, reviewerDurationMs } = await executeReviewer({
    stageConfig,
    session,
    stageState,
    builderOutput,
    maxTokens,
    apiKey
  });

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
