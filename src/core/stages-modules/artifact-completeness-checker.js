// warehouse:file
// responsibility: Checks if artifact has all required fields with non-empty values
// actor: core_runtime
// role: completeness_checker
// source_truth: implementation

const { STAGES } = require("./stage-schemas");

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

module.exports = { isArtifactComplete };
