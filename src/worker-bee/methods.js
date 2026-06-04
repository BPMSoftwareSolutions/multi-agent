// warehouse:file
// responsibility: Delegates method-anchor operations (def-location, assessment, writing) to focused modules
// actor: worker_bee_infrastructure
// role: projection_compiler
// source_truth: implementation

const { findDefs } = require("./methods/def-locator");
const { methodAnchorAbove, assessMethodAnchor, buildMethodAnchorBlock } = require("./methods/anchor-assessor");
const { applyMethodAnchors } = require("./methods/anchor-writer");

module.exports = {
  findDefs,
  methodAnchorAbove,
  assessMethodAnchor,
  buildMethodAnchorBlock,
  applyMethodAnchors: (absPath, items) => applyMethodAnchors(absPath, items, buildMethodAnchorBlock),
};
