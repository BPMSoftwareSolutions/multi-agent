// warehouse:file
// responsibility: Delegates round execution to focused modules; orchestrates agent execution and artifact handling
// actor: orchestration
// role: round_executor_delegator
// source_truth: implementation

const { STAGES } = require("../stages");
const { executeRoundAgents } = require("./round-executor-orchestrator");
const { createRoundRecord, storeRoundResult } = require("./round-record-builder");

// warehouse:method
// responsibility: Runs design workshop round by delegating to agent executor and artifact handler
// actor: orchestration
// role: round_executor_delegator
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

  // Execute agents and get results
  const agentResults = await executeRoundAgents({
    session,
    apiKey,
    stageId,
    stageState,
    stageConfig,
    roundNumber,
    humanInterjection,
    artifactBefore
  });

  // Build and store round record
  const round = createRoundRecord({
    roundNumber,
    humanInterjection,
    artifactBefore,
    builderOutput: agentResults.builderOutput,
    builderDurationMs: agentResults.builderDurationMs,
    reviewerOutput: agentResults.reviewerOutput,
    reviewerDurationMs: agentResults.reviewerDurationMs,
    artifactAfter: agentResults.artifactAfter
  });

  storeRoundResult(stageState, round, agentResults.reviewerOutput);

  return { roundNumber, round, stageState };
}

module.exports = {
  runRound
};
