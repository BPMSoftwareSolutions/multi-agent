// warehouse:file
// responsibility: Extracts key:value pairs from # comment lines at file start into object
// actor: header_parser
// role: reader
// source_truth: implementation

const fs = require("fs");

// warehouse:method
// responsibility: Extracts key:value pairs from # comment lines at file start into object
// actor: method_implementation
// role: implementation
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

module.exports = { readTaxonomyHeader };
