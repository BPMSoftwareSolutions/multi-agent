// warehouse:file
// responsibility: Inserts anchor block into file after shebang/coding declarations with EOL preservation
// actor: worker_bee_infrastructure
// role: anchor_writer
// source_truth: implementation

const fs = require("fs");
const { stripBom, dominantEol } = require("../text-utils");
const { hasFileAnchor } = require("./anchor-parser");

// warehouse:method
// responsibility: Inserts anchor block into file after shebang/coding declarations with EOL preservation
// actor: method_implementation
// role: implementation
// source_truth: implementation
function insertAnchor(absPath, anchorBlock) {
  const raw = fs.readFileSync(absPath, "utf8");
  if (hasFileAnchor(raw)) return false;
  const text = stripBom(raw);
  const eol = dominantEol(text);

  let offset = 0;
  const shebang = text.match(/^#![^\n]*\r?\n/);
  if (shebang) offset += shebang[0].length;
  const coding = text.slice(offset).match(/^#[^\n]*coding[:=][^\n]*\r?\n/);
  if (coding) offset += coding[0].length;

  const block = anchorBlock.split("\n").join(eol) + eol;
  const after = text.slice(offset);
  const needsBlank = after.length > 0 && !/^\r?\n/.test(after);
  const next = text.slice(0, offset) + block + (needsBlank ? eol : "") + after;

  fs.writeFileSync(absPath, next, "utf8");
  return true;
}

module.exports = { insertAnchor };
