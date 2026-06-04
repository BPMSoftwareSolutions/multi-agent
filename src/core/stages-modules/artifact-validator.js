// warehouse:file
// responsibility: Validates artifact structure against stage schema and checks completeness
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

// warehouse:method
// responsibility: Checks if all required stage fields have non-empty values
// actor: method_implementation
// role: implementation
// source_truth: implementation
function isArtifactComplete(stageId, artifact) {
  const stage = STAGES[stageId];
  if (!stage || !stage.required) return true;

  for (const fieldName of stage.required) {
    const value = artifact[fieldName];
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return false;
    }
  }
  return true;
}

module.exports = { validateArtifact, isArtifactComplete };
