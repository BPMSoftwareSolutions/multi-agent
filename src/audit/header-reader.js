// warehouse:file
// responsibility: Reads and extracts taxonomy header fields from JavaScript file comments
// actor: audit
// role: header_reader
// source_truth: implementation

const fs = require("fs");

// warehouse:method
// responsibility: undefined
// actor: undefined
// role: undefined
// source_truth: implementation

function readHeader(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");
    const header = {};

    for (const line of lines) {
      const trimmed = line.trim();
      // Skip shebang and empty lines
      if (trimmed.startsWith("#!") || !trimmed) continue;
      // Stop at first non-comment line
      if (!trimmed.startsWith("//")) break;

      const match = trimmed.match(/^\/\/\s*(\w+):\s*(.+)$/);
      if (match) {
        header[match[1]] = match[2].trim();
      }
    }

    return header;
  } catch (_e) {
    return {};
  }
}

module.exports = { readHeader };
