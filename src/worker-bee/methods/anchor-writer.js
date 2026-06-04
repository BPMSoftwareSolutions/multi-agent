// warehouse:file
// responsibility: Applies or replaces method anchors in file with bottom-up edits preserving line endings
// actor: worker_bee_infrastructure
// role: projection_compiler
// source_truth: implementation

const fs = require("fs");
const { stripBom, dominantEol, splitKeepEnds } = require("../scan");

// warehouse:method
// responsibility: undefined
// actor: undefined
// role: undefined
// source_truth: implementation

function applyMethodAnchors(absPath, items, buildMethodAnchorBlock) {
  const valid = items.filter((it) => it.fields);
  if (valid.length === 0) return 0;

  const raw = fs.readFileSync(absPath, "utf8");
  const text = stripBom(raw);
  const eol = dominantEol(text);
  const segments = splitKeepEnds(text);

  valid.sort((a, b) => b.def.lineIdx - a.def.lineIdx); // bottom-up
  let written = 0;
  for (const { def, fields } of valid) {
    const blockSegs = buildMethodAnchorBlock(def.indent, fields)
      .split("\n")
      .map((t) => ({ text: t, eol }));
    if (def.existing && def.existing.hasMarker) {
      segments.splice(def.existing.start, def.existing.end - def.existing.start + 1, ...blockSegs);
    } else {
      segments.splice(def.lineIdx, 0, ...blockSegs);
    }
    written += 1;
  }

  const out = segments.map((s) => s.text + s.eol).join("");
  if (out !== raw) fs.writeFileSync(absPath, out, "utf8");
  return written;
}

module.exports = { applyMethodAnchors };
