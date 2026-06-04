// warehouse:file
// responsibility: Constructs and applies file anchors with proper formatting and line-ending preservation
// actor: worker_bee_infrastructure
// role: builder
// source_truth: implementation

const fs = require("fs");
const { FILE_ANCHOR_FIELD_ORDER } = require("../anchor-spec");
const { stripBom, dominantEol } = require("../text-utils");
const { hasFileAnchor } = require("./anchor-parser");

// warehouse:method
// responsibility: Assembles file-anchor comment block from model and deterministic fields
// actor: worker_bee_infrastructure
// role: builder
// source_truth: implementation
function buildAnchorBlock(modelFields, deterministic) {
  const merged = {
    actor: modelFields.actor,
    role: modelFields.role,
    responsibility: modelFields.responsibility,
    expected_location: deterministic.expected_location,
    repo_root_depth: deterministic.repo_root_depth,
    source_truth: modelFields.source_truth,
    mutation_policy: modelFields.mutation_policy,
    generated: modelFields.generated === true ? "true" : "false",
  };
  const lines = ["# warehouse:file"];
  for (const key of FILE_ANCHOR_FIELD_ORDER) {
    let value = merged[key];
    if (value === undefined || value === null || value === "") {
      value = "unknown";
    }
    lines.push(`# ${key}: ${value}`);
  }
  return lines.join("\n");
}

// warehouse:method
// responsibility: Inserts anchor block after shebang/coding declaration at file start
// actor: worker_bee_infrastructure
// role: writer
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

const FILE_ANCHOR_BLOCK_RE = /[ \t]*#[ \t]+warehouse:file[ \t]*(?:\r?\n[ \t]*#[^\n]*)*/;

// warehouse:method
// responsibility: Replaces existing anchor in place or inserts if missing
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

module.exports = { buildAnchorBlock, insertAnchor, replaceAnchor };
