// warehouse:file
// responsibility: Recursively discovers Python files in directory tree with skip list filtering
// actor: worker_bee_infrastructure
// role: scanner
// source_truth: implementation

const fs = require("fs");
const path = require("path");

const SKIP_DIRS = new Set([
  ".git", ".venv", ".mypy_cache", ".pytest_cache", "__pycache__",
  "build", "dist", "docs", "generated", "archive", "temp", "node_modules",
]);

// warehouse:method
// responsibility: Recursively discovers and collects Python files in directory tree with skip list filtering and sorting
// actor: method_implementation
// role: implementation
// source_truth: implementation
function listPythonFiles(root) {
  const out = [];
  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (_err) {
      return;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        walk(path.join(dir, entry.name));
      } else if (entry.isFile() && entry.name.endsWith(".py")) {
        out.push(path.join(dir, entry.name));
      }
    }
  }
  walk(root);
  out.sort();
  return out;
}

module.exports = { listPythonFiles, SKIP_DIRS };
