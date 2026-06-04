// warehouse:file
// responsibility: Recursively traverses directory tree and collects all JavaScript file paths
// actor: file_scanner
// role: traverser
// source_truth: implementation

const fs = require("fs");
const path = require("path");

// warehouse:method
// responsibility: Recursively walks directory tree collecting .js files
// actor: file_scanner
// role: traverser
// source_truth: implementation
function walk(dir) {
  const files = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...walk(fullPath));
      } else if (entry.isFile() && entry.name.endsWith(".js")) {
        files.push(fullPath);
      }
    }
  } catch (_e) {
    /* skip */
  }
  return files;
}

module.exports = { walk };
