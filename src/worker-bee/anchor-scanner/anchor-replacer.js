// warehouse:file
// responsibility: Replaces existing file anchors or inserts new ones with formatting preservation
// actor: worker_bee_infrastructure
// role: writer
// source_truth: implementation

const fs = require("fs");
const { stripBom, dominantEol } = require("../text-utils");
const { insertAnchor } = require("./anchor-inserter");

const FILE_ANCHOR_BLOCK_RE = /[ \t]*#[ \t]+warehouse:file[ \t]*(?:\r?\n[ \t]*#[^\n]*)*/;

// warehouse:method
// responsibility: Replaces existing anchor block or inserts if not present, preserving line endings
// actor: worker_bee_infrastructure
// role: writer
// source_truth: implementation
function replaceAnchor(absPath, anchorBlock) {
  const raw = fs.readFileSync(absPath, "utf8");
  const text = stripBom(raw);
  if (!FILE_ANCHOR_BLOCK_RE.test(text)) return insertAnchor(absPath, anchorBlock);
  const eol = dominantEol(text);
  const block = anchorBlock.split("\n").join(eol);
  const next = text.replace(FILE_ANCHOR_BLOCK_RE, block);
  if (next !== raw) fs.writeFileSync(absPath, next, "utf8");
  return true;
}

module.exports = { replaceAnchor };
