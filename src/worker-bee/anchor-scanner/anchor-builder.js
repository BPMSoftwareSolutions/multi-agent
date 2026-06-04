// warehouse:file
// responsibility: Delegates anchor build and application to focused modules
// actor: worker_bee_infrastructure
// role: orchestrator
// source_truth: implementation

const { buildAnchorBlock } = require("./anchor-block-builder");
const { insertAnchor } = require("./anchor-inserter");
const { replaceAnchor } = require("./anchor-replacer");

module.exports = { buildAnchorBlock, insertAnchor, replaceAnchor };
