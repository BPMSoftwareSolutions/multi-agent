// warehouse:file
// responsibility: Validates and assesses method anchor fields for completeness and quality with block construction
// actor: worker_bee_infrastructure
// role: assessor
// source_truth: implementation

const { isPlaceholder, isGenericResponsibility } = require("../scan");
const { METHOD_ANCHOR_FIELD_ORDER } = require("../anchor-spec");

const METHOD_MARKER_RE = /^\s*#\s+warehouse:(method|function)\s*$/;
const REQUIRED_METHOD_FIELDS = ["responsibility", "input_contract", "output_contract", "forbidden", "validation"];

// warehouse:method
// warehouse:method
// responsibility: Finds existing warehouse:method anchor comment block above function definition by scanning upward
// actor: method_implementation
// role: implementation
// source_truth: implementation
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

// warehouse:method
// responsibility: Assesses method anchor fields by validating completeness of required fields and detecting generic or problematic responsibility text
// actor: worker_bee_infrastructure
// role: projection_compiler
// source_truth: implementation
function assessMethodAnchor(fields) {
  const issues = [];
  for (const key of REQUIRED_METHOD_FIELDS) {
    if (isPlaceholder(fields[key])) issues.push(`${key}:missing_or_placeholder`);
  }
  if (isGenericResponsibility(fields.responsibility)) issues.push("responsibility:generic");
  return issues;
}

// warehouse:method
// responsibility: Constructs properly indented method anchor comment block by formatting fields in spec order
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildMethodAnchorBlock(indent, fields) {
  const out = [`${indent}# warehouse:method`];
  for (const key of METHOD_ANCHOR_FIELD_ORDER) {
    let value = fields[key];
    if (value === undefined || value === null || String(value).trim() === "") value = "unknown";
    out.push(`${indent}# ${key}: ${value}`);
  }
  return out.join("\n");
}

module.exports = { methodAnchorAbove, assessMethodAnchor, buildMethodAnchorBlock };
