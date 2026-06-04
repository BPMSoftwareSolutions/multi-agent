// warehouse:file
// responsibility: Parses and validates taxonomy header metadata from JavaScript file comment blocks
// actor: header_parser
// role: extractor
// source_truth: implementation

const fs = require("fs");

// warehouse:method
// responsibility: Extracts taxonomy header fields from JavaScript comments into key-value object
// actor: method_implementation
// role: implementation
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

// warehouse:method
// responsibility: Validates that all required header fields (warehouse, responsibility, actor, role) are populated
// actor: method_implementation
// role: implementation
// source_truth: implementation
function isComplete(header) {
  const required = ["warehouse", "responsibility", "actor", "role"];
  return required.every((field) => field in header && header[field]);
}

module.exports = { readHeader, isComplete };
