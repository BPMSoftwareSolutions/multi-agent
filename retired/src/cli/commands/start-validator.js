// warehouse:file
// responsibility: undefined — validateBrief
// actor: method_implementation
// role: implementation
// source_truth: implementation

// warehouse:method
// responsibility: undefined — validateBrief
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
