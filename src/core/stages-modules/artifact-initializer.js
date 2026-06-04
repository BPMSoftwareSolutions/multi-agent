// warehouse:file
// responsibility: Maps stage schema fields to empty typed values (empty strings or arrays)
// actor: core_runtime
// role: initializer
// source_truth: implementation

const { STAGES } = require("./stage-schemas");

// warehouse:method
// responsibility: Maps stage schema fields to empty typed values (empty strings or arrays)
// actor: method_implementation
// role: implementation
// source_truth: implementation
function createEmptyArtifact(stageId) {
  const stage = STAGES[stageId];
  if (!stage) return {};
  return Object.entries(stage.schema).reduce((artifact, [field, meta]) => {
    artifact[field] = meta.type.endsWith("[]") ? [] : "";
    return artifact;
  }, {});
}

module.exports = { createEmptyArtifact };
