// warehouse:file
// responsibility: Parses and validates taxonomy headers from file comment blocks
// actor: header_parser
// role: validator
// source_truth: implementation

const { readTaxonomyHeader } = require("./header-reader");
const { isComplete } = require("./header-validator");

module.exports = { readTaxonomyHeader, isComplete };
