// warehouse:file
// responsibility: Initializes empty artifacts for stages with schema-defined typed fields
// actor: core_runtime
// role: initializer
// source_truth: implementation

const { STAGES } = require("./stage-schemas");

// warehouse:method
// responsibility: Initializes empty artifacts: creates typed fields for specified stage schema
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
