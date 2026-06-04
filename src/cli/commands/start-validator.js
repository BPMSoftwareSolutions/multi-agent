// warehouse:file
// responsibility: undefined
// actor: undefined
// role: undefined
// source_truth: implementation

// warehouse:method
// responsibility: undefined
// actor: undefined
// role: undefined
// source_truth: implementation

function validateBrief(brief) {
  if (!brief || typeof brief !== "string") {
    throw new Error("brief is required and must be a string");
  }
  return true;
}

module.exports = { validateBrief };
