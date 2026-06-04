// warehouse:file
// responsibility: undefined — computeRepoRootDepth
// actor: method_implementation
// role: implementation
// source_truth: implementation

// warehouse:method
// responsibility: undefined — computeRepoRootDepth
// actor: method_implementation
// role: implementation
// source_truth: implementation
function computeRepoRootDepth(text, relPosix) {
  const literal = text.match(/parentsLevel:\s*(\d+)/);
  if (literal) return parseInt(literal[1], 10);
  return relPosix.split("/").length - 1;
}

module.exports = { computeRepoRootDepth };
