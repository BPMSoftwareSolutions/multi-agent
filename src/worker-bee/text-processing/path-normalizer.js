// warehouse:file
// responsibility: Normalizes absolute paths to repo-relative POSIX format for cross-platform consistency
// actor: worker_bee_infrastructure
// role: text_processor
// source_truth: implementation

const path = require("path");

// warehouse:method
// responsibility: Converts absolute path to repo-relative POSIX format for cross-platform consistency
// actor: method_implementation
// role: implementation
// source_truth: implementation
function repoRelative(absPath, repoRoot) {
  return path.relative(repoRoot, absPath).split(path.sep).join("/");
}

// warehouse:method
// responsibility: Normalizes whitespace and path separators to forward slashes
// actor: method_implementation
// role: implementation
// source_truth: implementation
function normPath(p) {
  return (p || "").trim().split(path.sep).join("/");
}

module.exports = {
  repoRelative,
  normPath,
};
