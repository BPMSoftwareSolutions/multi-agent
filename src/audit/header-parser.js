// warehouse:file
// responsibility: Parses taxonomy headers from JavaScript file comments into key-value objects
// actor: header_parser
// role: extractor
// source_truth: implementation

const fs = require("fs");

// warehouse:method
// responsibility: Parses taxonomy header fields from JavaScript file comments into key-value objects for header validation
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
// responsibility: Validates taxonomy header completeness by checking all required fields (warehouse, responsibility, actor, role) have non-empty values
// actor: method_implementation
// role: implementation
// source_truth: implementation
function isComplete(header) {
  const required = ["warehouse", "responsibility", "actor", "role"];
  return required.every((field) => field in header && header[field]);
}

module.exports = { readHeader, isComplete };
