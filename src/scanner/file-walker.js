// warehouse:file
// responsibility: Recursively scans directory tree to collect Python files for taxonomy audit coverage
// actor: scanner
// role: file_discoverer
// source_truth: implementation

const fs = require("fs");
const path = require("path");

// warehouse:method
// responsibility: Scans and traverses directory tree to collect all Python files for taxonomy audit coverage verification
// actor: method_implementation
// role: implementation
// source_truth: implementation
function walk(dir, ext = ".py") {
  const files = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...walk(fullPath, ext));
      } else if (entry.isFile() && entry.name.endsWith(ext)) {
        files.push(fullPath);
      }
    }
  } catch (_e) {
    /* skip inaccessible dirs */
  }
  return files;
}

module.exports = { walk };
