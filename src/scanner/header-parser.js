// warehouse:file
// responsibility: Exports taxonomy header parsing and validation functions
// actor: scanner
// role: header_reader_and_validator
// source_truth: implementation

const { readTaxonomyHeader } = require("./header-reader");
const { isComplete } = require("./header-validator");

// warehouse:method
// responsibility: Exports taxonomy header parsing and validation functions
// actor: method_implementation
// role: pass_through_orchestrator
// source_truth: implementation
function createHeaderParser() {
  return {
    readTaxonomyHeader,
    isComplete
  };
}

module.exports = { readTaxonomyHeader, isComplete, createHeaderParser };
