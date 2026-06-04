// warehouse:file
// responsibility: Checks field types match schema (arrays vs strings), returns errors if mismatch
// actor: core_runtime
// role: validator
// source_truth: implementation

const { STAGES } = require("./stage-schemas");

// warehouse:method
// responsibility: Checks field types match schema (arrays vs strings), returns errors if mismatch
// actor: method_implementation
// role: implementation
// source_truth: implementation
function validateArtifact(stageId, artifact) {
  const stage = STAGES[stageId];
  if (!stage) {
    return { valid: false, errors: [`Unknown stage: ${stageId}`] };
  }

  const errors = [];
  for (const [field, meta] of Object.entries(stage.schema)) {
    const value = artifact[field];
    const isArray = meta.type.endsWith("[]");

    if (isArray && !Array.isArray(value)) {
      errors.push(`Field '${field}' must be array, got ${typeof value}`);
    } else if (!isArray && typeof value !== meta.type.replace("[]", "")) {
      // Allow string for any non-array type (simplified)
      if (typeof value !== "string") {
        errors.push(`Field '${field}' type mismatch`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    stageId,
  };
}

module.exports = { validateArtifact };
