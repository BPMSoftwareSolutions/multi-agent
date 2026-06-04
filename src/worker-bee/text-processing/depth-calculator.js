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

function computeRepoRootDepth(text, relPosix) {
  const literal = text.match(/parentsLevel:\s*(\d+)/);
  if (literal) return parseInt(literal[1], 10);
  return relPosix.split("/").length - 1;
}

module.exports = { computeRepoRootDepth };
