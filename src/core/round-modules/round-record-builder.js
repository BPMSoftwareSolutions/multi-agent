// warehouse:file
// responsibility: undefined — createRoundRecord
// actor: method_implementation
// role: implementation
// source_truth: implementation

// warehouse:method
// responsibility: undefined — createRoundRecord
// actor: method_implementation
// role: implementation
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
// responsibility: undefined — storeRoundResult
// actor: method_implementation
// role: implementation
// source_truth: implementation
function storeRoundResult(stageState, round, reviewerOutput) {
  stageState.rounds.push(round);
  stageState.proposedArtifact = reviewerOutput.suggested_artifact;
}

module.exports = {
  createRoundRecord,
  storeRoundResult
};
