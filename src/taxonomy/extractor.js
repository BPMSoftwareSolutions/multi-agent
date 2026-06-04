// warehouse:file
// responsibility: Processes supported source files and extracts warehouse file method taxonomy including undocumented methods for coherence validation
// actor: taxonomy_analyzer
// role: extractor
// source_truth: implementation

const fs = require("fs");
const path = require("path");
const { extractFileHeader } = require("./file-header-extractor");
const { extractMethodHeaders } = require("./method-header-extractor");
const { isValidTaxonomy } = require("./taxonomy-validator");

// warehouse:method
// responsibility: Processes supported source files and extracts warehouse file method taxonomy including undocumented methods for coherence validation
// actor: method_implementation
// role: implementation
// source_truth: implementation
function extractFromFile(filePath, root) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const relPath = path.relative(root, filePath).replace(/\\/g, "/");

    const fileHeader = extractFileHeader(content);
    const methods = extractMethodHeaders(content, filePath);

    if (!isValidTaxonomy(fileHeader)) {
      return null;
    }

    return {
      path: relPath,
      file: fileHeader,
      methods,
      totalMethods: methods.length,
      documentedMethods: methods.filter((m) => isValidTaxonomy(m.taxonomy)).length,
    };
  } catch (_e) {
    return null;
  }
}

module.exports = { extractFromFile, extractFileHeader, extractMethodHeaders, isValidTaxonomy };
