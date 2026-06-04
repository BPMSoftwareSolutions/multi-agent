// warehouse:file
// responsibility: Delegates to stage schema and artifact initialization modules
// actor: core_runtime
// role: entry_point
// source_truth: implementation

const { STAGE_ORDER, STAGES } = require("./stages-modules/stage-schemas");
const { createEmptyArtifact } = require("./stages-modules/artifact-initializer");

module.exports = { STAGE_ORDER, STAGES, createEmptyArtifact };
