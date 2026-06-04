// warehouse:file
// responsibility: Builds and stores round records with agent results and artifact tracking
// actor: orchestration
// role: round_record_builder
// source_truth: implementation

// warehouse:method
// responsibility: Creates round record with metadata and agent execution results, returns record structure
// actor: orchestration
// role: round_record_builder
// source_truth: implementation
function createRoundRecord({
  roundNumber,
  humanInterjection,
  artifactBefore,
  builderOutput,
  builderDurationMs,
  reviewerOutput,
  reviewerDurationMs,
  artifactAfter
}) {
  return {
    roundNumber,
    timestamp: new Date().toISOString(),
    humanInterjection,
    artifactBefore,
    planner: { artifact: builderOutput, durationMs: builderDurationMs },
    reviewer: { ...reviewerOutput, durationMs: reviewerDurationMs },
    artifactAfter
  };
}

// warehouse:method
// responsibility: Stores round record to stage state and updates proposed artifact for review
// actor: orchestration
// role: round_record_builder
// source_truth: implementation
function storeRoundResult(stageState, round, reviewerOutput) {
  stageState.rounds.push(round);
  stageState.proposedArtifact = reviewerOutput.suggested_artifact;
}

module.exports = {
  createRoundRecord,
  storeRoundResult
};
