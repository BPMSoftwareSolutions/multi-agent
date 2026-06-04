// warehouse:file
// responsibility: Checks if all required metadata fields (responsibility, actor, role, source_truth) are present
// actor: method_implementation
// role: implementation
// source_truth: implementation

// warehouse:method
// responsibility: Checks if all required metadata fields (responsibility, actor, role, source_truth) are present
// actor: method_implementation
// role: implementation
// source_truth: implementation
function isComplete(header) {
  const required = ["responsibility", "actor", "role", "source_truth"];
  return required.every((field) => field in header && header[field]);
}

module.exports = { isComplete };
