// warehouse:file
// responsibility: Locates function definitions, parses and assesses method anchors, and applies trustworthy replacements with minimal-diff writes
// actor: worker_bee_infrastructure
// role: projection_compiler
// source_truth: implementation

// Method-anchor engine: locate functions, find/score their `# warehouse:method`
// anchors, and apply trustworthy replacements with minimal-diff writes.

const fs = require("fs");
const {
  stripBom,
  dominantEol,
  splitKeepEnds,
  isPlaceholder,
  isGenericResponsibility,
} = require("./scan");
const { METHOD_ANCHOR_FIELD_ORDER } = require("./anchor-spec");

const DEF_RE = /^(\s*)(?:async\s+)?def\s+([A-Za-z_]\w*)/;
const METHOD_MARKER_RE = /^\s*#\s+warehouse:(method|function)\s*$/;
const REQUIRED_METHOD_FIELDS = ["responsibility", "input_contract", "output_contract", "forbidden", "validation"];

// Find every function/method definition. Returns [{ id, name, indent, lineIdx }].
function findDefs(lines) {
  const defs = [];
  let id = 0;
  for (let i = 0; i < lines.length; i += 1) {
    const m = lines[i].match(DEF_RE);
    if (m) {
      defs.push({ id: id++, name: m[2], indent: m[1], lineIdx: i });
    }
  }
  return defs;
}

// Find an existing warehouse:method anchor in the comment/decorator region above
// a def. Returns { start, end, fields, hasMarker } (inclusive line span of the
// contiguous comment block holding the marker) or null.
function methodAnchorAbove(lines, defIdx) {
  let markerLine = -1;
  for (let j = defIdx - 1; j >= 0; j -= 1) {
    const s = lines[j].trim();
    if (s === "") continue;
    if (s.startsWith("@")) continue; // decorator
    if (s.startsWith("#")) {
      if (METHOD_MARKER_RE.test(lines[j])) {
        markerLine = j;
        break;
      }
      continue;
    }
    break; // hit a code line
  }
  if (markerLine === -1) return null;

  let start = markerLine;
  let end = markerLine;
  while (start - 1 >= 0 && lines[start - 1].trim().startsWith("#")) start -= 1;
  while (end + 1 < defIdx && lines[end + 1].trim().startsWith("#")) end += 1;

  const fields = {};
  for (let k = start; k <= end; k += 1) {
    const fm = lines[k].trim().match(/^#\s*([A-Za-z0-9_]+)\s*:\s*(.*?)\s*$/);
    if (fm) fields[fm[1]] = fm[2].trim();
  }
  return { start, end, fields, hasMarker: true };
}

// Issue codes for an existing method anchor. Empty = trustworthy.
function assessMethodAnchor(fields) {
  const issues = [];
  for (const key of REQUIRED_METHOD_FIELDS) {
    if (isPlaceholder(fields[key])) issues.push(`${key}:missing_or_placeholder`);
  }
  if (isGenericResponsibility(fields.responsibility)) issues.push("responsibility:generic");
  return issues;
}

// Build an indented method-anchor comment block.
function buildMethodAnchorBlock(indent, fields) {
  const out = [`${indent}# warehouse:method`];
  for (const key of METHOD_ANCHOR_FIELD_ORDER) {
    let value = fields[key];
    if (value === undefined || value === null || String(value).trim() === "") value = "unknown";
    out.push(`${indent}# ${key}: ${value}`);
  }
  return out.join("\n");
}

// Apply method anchors to a file. items = [{ def, fields }] where def carries
// { lineIdx, indent, existing }. Edits are applied bottom-up and preserve the
// line endings of untouched lines. Returns the number of anchors written.
function applyMethodAnchors(absPath, items) {
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

module.exports = {
  findDefs,
  methodAnchorAbove,
  assessMethodAnchor,
  buildMethodAnchorBlock,
  applyMethodAnchors,
};
