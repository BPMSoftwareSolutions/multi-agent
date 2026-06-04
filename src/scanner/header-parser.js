// warehouse:file
// responsibility: Parses taxonomy headers from file comment blocks and validates completeness of required metadata fields
// actor: header_parser
// role: validator
// source_truth: implementation

const fs = require("fs");

// warehouse:method
// responsibility: Parses taxonomy metadata fields from file header comment block and extracts key-value pairs
// actor: header_parser
// role: validator
// source_truth: implementation
function readTaxonomyHeader(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");
    const header = {};

    for (const line of lines) {
      if (!line.trim().startsWith("#")) break;
      const match = line.match(/^#\s*(\w+):\s*(.+)$/);
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
// responsibility: Validates taxonomy header completeness by checking presence of all required metadata fields
// actor: header_parser
// role: validator
// source_truth: implementation
function isComplete(header) {
  const required = ["responsibility", "actor", "role", "source_truth"];
  return required.every((field) => field in header && header[field]);
}

module.exports = { readTaxonomyHeader, isComplete };
