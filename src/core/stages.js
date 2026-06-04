// warehouse:file
// responsibility: Stage definitions aggregator - delegates to modules for schemas and artifact initialization
// actor: core_runtime
// role: entry_point
// source_truth: implementation

const { STAGE_ORDER, STAGES } = require("./stages-modules/stage-schemas");
const { createEmptyArtifact } = require("./stages-modules/artifact-initializer");

module.exports = { STAGE_ORDER, STAGES, createEmptyArtifact };
