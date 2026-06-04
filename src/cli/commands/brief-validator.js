// warehouse:file
// responsibility: Validates brief input string format and presence
// actor: cli
// role: validator
// source_truth: implementation

// warehouse:method
// responsibility: Validates brief is a non-empty string
// actor: method_implementation
// role: implementation
// source_truth: implementation
function validateBrief(brief) {
  if (!brief || typeof brief !== "string") {
    throw new Error("brief is required and must be a string");
  }
  return true;
}

module.exports = { validateBrief };
