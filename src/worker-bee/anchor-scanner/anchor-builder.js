// warehouse:file
// responsibility: Builds anchor data structures from parsed metadata with validation and serialization
// actor: worker_bee_infrastructure
// role: anchor_builder
// source_truth: implementation

const { buildAnchorBlock } = require("./anchor-block-builder");
const { insertAnchor } = require("./anchor-inserter");
const { replaceAnchor } = require("./anchor-replacer");

module.exports = { buildAnchorBlock, insertAnchor, replaceAnchor };
