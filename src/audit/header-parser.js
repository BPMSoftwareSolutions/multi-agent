// warehouse:file
// responsibility: Delegates header parsing and validation to focused modules; orchestrates reading and validation workflow
// actor: audit
// role: header_parser_delegator
// source_truth: implementation

const { readHeader } = require("./header-reader");
const { isComplete } = require("./header-validator");

module.exports = { readHeader, isComplete };
