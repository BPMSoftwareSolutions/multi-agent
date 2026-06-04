// warehouse:file
// responsibility: Converts paths to repo-relative POSIX format and computes directory depth
// actor: worker_bee_infrastructure
// role: path_normalizer
// source_truth: implementation

const path = require("path");

// warehouse:method
// responsibility: Converts absolute file path to repo-relative POSIX-style path
// actor: worker_bee_infrastructure
// role: path_normalizer
// source_truth: implementation
function repoRelative(absPath, repoRoot) {
  return path.relative(repoRoot, absPath).split(path.sep).join("/");
}

// warehouse:method
// responsibility: Computes parents[N] index for repo root from code literal or path depth
// actor: worker_bee_infrastructure
// role: path_calculator
// source_truth: implementation
function computeRepoRootDepth(text, relPosix) {
  const literal = text.match(/parentsLevel:\s*(\d+)/);
  if (literal) return parseInt(literal[1], 10);
  return relPosix.split("/").length - 1;
}

// warehouse:method
// responsibility: Normalizes path to forward slashes and trims whitespace for consistent comparison
// actor: worker_bee_infrastructure
// role: path_normalizer
// source_truth: implementation
function normPath(p) {
  return (p || "").trim().split(path.sep).join("/");
}

module.exports = {
  repoRelative,
  computeRepoRootDepth,
  normPath,
};
