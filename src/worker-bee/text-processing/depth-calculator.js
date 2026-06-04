// warehouse:file
// responsibility: Computes directory depth from repo root, using explicit parentsLevel metadata or calculated from path
// actor: worker_bee_infrastructure
// role: path_calculator
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
