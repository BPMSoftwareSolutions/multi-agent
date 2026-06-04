// warehouse:file
// responsibility: Delegator for round execution, intent normalization, and stage management
// actor: orchestration
// role: delegator
// source_truth: implementation

const { normalizeIntent } = require("./round-modules/intent-normalizer");
const { runRound } = require("./round-modules/round-executor");
const { acceptArtifact, advanceStage } = require("./round-modules/stage-manager");

module.exports = {
  normalizeIntent,
  runRound,
  acceptArtifact,
  advanceStage
};
