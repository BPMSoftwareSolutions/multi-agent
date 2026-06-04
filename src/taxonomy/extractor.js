// warehouse:file
// responsibility: Extracts warehouse:file and warehouse:method headers from JavaScript files into taxonomy structures
// actor: taxonomy_extractor
// role: data_exporter
// source_truth: implementation

const fs = require("fs");
const path = require("path");

// warehouse:method
// responsibility: Extracts warehouse:file header from JavaScript file into a key-value object
// actor: header_parser
// role: extractor
// source_truth: implementation
function extractFileHeader(content) {
  const lines = content.split("\n");
  const header = {};
  let foundFileHeader = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#!") || !trimmed) continue;
    if (!trimmed.startsWith("//")) break;

    // Parse warehouse:X field
    const match = trimmed.match(/^\/\/\s*(\w+):(.*)$/);
    if (match) {
      const key = match[1];
      const value = match[2].trim();
      header[key] = value;

      if (key === "warehouse" && value === "file") {
        foundFileHeader = true;
      }
    }
  }

  return foundFileHeader ? header : {};
}

// warehouse:method
// responsibility: Extracts all warehouse:method headers from JavaScript file into an array of method taxonomies
// actor: header_parser
// role: extractor
// source_truth: implementation
function extractMethodHeaders(content) {
  const lines = content.split("\n");
  const methods = [];
  let currentMethod = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check if this is a method header start
    if (trimmed.match(/^\/\/\s*warehouse:\s*method/)) {
      currentMethod = { name: null, taxonomy: { warehouse: "method" } };
      continue;
    }

    // Collect taxonomy lines for current method
    if (currentMethod && trimmed.startsWith("//")) {
      const match = trimmed.match(/^\/\/\s*(\w+):\s*(.*)$/);
      if (match && match[1] !== "warehouse") {
        currentMethod.taxonomy[match[1]] = match[2].trim();
      }
    }

    // Check for function definition after method header
    if (
      currentMethod &&
      (trimmed.startsWith("function ") ||
        trimmed.startsWith("const ") ||
        trimmed.startsWith("async "))
    ) {
      // Extract function name from various patterns
      let nameMatch = trimmed.match(/function\s+(\w+)/);
      if (!nameMatch) nameMatch = trimmed.match(/const\s+(\w+)/);
      if (!nameMatch) nameMatch = trimmed.match(/async\s+(\w+)/);

      if (nameMatch) {
        currentMethod.name = nameMatch[1];
        methods.push(currentMethod);
        currentMethod = null;
      }
    }
  }

  return methods;
}

// warehouse:method
// responsibility: Validates that taxonomy object contains required warehouse, responsibility, actor, and role fields
// actor: taxonomy_validator
// role: validator
// source_truth: implementation
function isValidTaxonomy(taxonomy) {
  const required = ["warehouse", "responsibility", "actor", "role"];
  return required.every((field) => field in taxonomy && taxonomy[field]);
}

// warehouse:method
// responsibility: Processes a JavaScript file and extracts both file-level and method-level taxonomy with validation
// actor: taxonomy_extractor
// role: processor
// source_truth: implementation
function extractFromFile(filePath, root) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const relPath = path.relative(root, filePath).replace(/\\/g, "/");

    const fileHeader = extractFileHeader(content);
    const methods = extractMethodHeaders(content);

    if (!isValidTaxonomy(fileHeader)) {
      return null;
    }

    return {
      path: relPath,
      file: fileHeader,
      methods: methods.filter((m) => isValidTaxonomy(m.taxonomy)),
      totalMethods: methods.length,
      documentedMethods: methods.filter((m) => isValidTaxonomy(m.taxonomy)).length,
    };
  } catch (_e) {
    return null;
  }
}

module.exports = { extractFromFile, extractFileHeader, extractMethodHeaders, isValidTaxonomy };
