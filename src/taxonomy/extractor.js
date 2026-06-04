// warehouse:file
// responsibility: Processes JavaScript file and extracts warehouse:file and warehouse:method level taxonomy structures
// actor: taxonomy_analyzer
// role: extractor
// source_truth: implementation

const fs = require("fs");
const path = require("path");
const { extractFileHeader } = require("./file-header-extractor");
const { extractMethodHeaders } = require("./method-header-extractor");
const { isValidTaxonomy } = require("./taxonomy-validator");

// warehouse:method
// responsibility: Processes a JavaScript file and extracts both warehouse:file and warehouse:method level taxonomy structures with validation
// actor: method_implementation
// role: implementation
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
