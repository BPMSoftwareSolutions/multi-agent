// warehouse:file
// responsibility: Converts paths to repo-relative POSIX format and computes directory depth
// actor: worker_bee_infrastructure
// role: path_normalizer
// source_truth: implementation

const path = require("path");

// warehouse:method
// responsibility: Converts paths to repo-relative POSIX format: normalizes absolute paths for cross-platform consistency
// actor: method_implementation
// role: implementation
// source_truth: implementation
function repoRelative(absPath, repoRoot) {
  return path.relative(repoRoot, absPath).split(path.sep).join("/");
}

// warehouse:method
// responsibility: Converts paths to repo-relative POSIX format: computes directory depth from repo root
// actor: method_implementation
// role: implementation
// source_truth: implementation
function computeRepoRootDepth(text, relPosix) {
  const literal = text.match(/parentsLevel:\s*(\d+)/);
  if (literal) return parseInt(literal[1], 10);
  return relPosix.split("/").length - 1;
}

// warehouse:method
// responsibility: Converts paths to repo-relative POSIX format: normalizes whitespace and path separators
// actor: method_implementation
// role: implementation
// source_truth: implementation
function normPath(p) {
  return (p || "").trim().split(path.sep).join("/");
}

module.exports = {
  repoRelative,
  computeRepoRootDepth,
  normPath,
};
