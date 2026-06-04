// warehouse:file
// responsibility: Validates start command arguments
// actor: cli
// role: validator
// source_truth: implementation

// warehouse:method
// responsibility: Validates that brief argument is present and properly typed
// actor: cli
// role: validator
// source_truth: implementation
function validateBrief(brief) {
  if (!brief || typeof brief !== "string") {
    throw new Error("brief is required and must be a string");
  }
  return true;
}

module.exports = { validateBrief };
