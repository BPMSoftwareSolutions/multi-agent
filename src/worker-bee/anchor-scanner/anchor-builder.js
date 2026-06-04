// warehouse:file
// responsibility: Exports anchor operations by delegating to specialized modules for building, inserting, and replacing anchors
// actor: worker_bee_infrastructure
// role: anchor_coordinator
// source_truth: implementation

const { buildAnchorBlock } = require("./anchor-block-builder");
const { insertAnchor } = require("./anchor-inserter");
const { replaceAnchor } = require("./anchor-replacer");

module.exports = { buildAnchorBlock, insertAnchor, replaceAnchor };
