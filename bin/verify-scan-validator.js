// warehouse:file
// responsibility: Validates taxonomy header fields presence and placeholder detection for test verification
// actor: test_infrastructure
// role: validator
// source_truth: implementation

const fs = require("fs");

// warehouse:method
// responsibility: Test-driven validation: extracts taxonomy header fields from Python file comments
// actor: method_implementation
// role: implementation
// source_truth: implementation
function readTaxonomyHeader(filePath) {
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
}

// warehouse:method
// responsibility: Test-driven validation: validates required taxonomy header fields are present and non-placeholder
// actor: method_implementation
// role: implementation
// source_truth: implementation
function isComplete(header) {
  // SIMPLE: check if all required fields are present
  const required = ["responsibility", "actor", "role", "source_truth"];
  return required.every((field) => field in header && header[field]);
}

module.exports = { readTaxonomyHeader, isComplete };
