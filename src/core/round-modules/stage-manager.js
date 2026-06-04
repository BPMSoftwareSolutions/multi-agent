// warehouse:file
// responsibility: Delegator: manages artifact acceptance and stage progression lifecycle
// actor: orchestration
// role: artifact_acceptance, stage_progression
// source_truth: implementation

const { acceptArtifact } = require("./artifact-acceptor");
const { advanceStage } = require("./stage-advancer");

module.exports = {
  acceptArtifact,
  advanceStage
};
