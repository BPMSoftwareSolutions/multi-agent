// warehouse:file
// responsibility: Provides hasFileAnchor, parseFileAnchorLines, parseFileAnchor functionality
// actor: worker_bee_infrastructure
// role: parser
// source_truth: implementation

const { stripBom } = require("../text-utils");

const FILE_ANCHOR_RE = /^#\s+warehouse:file\s*$/m;

// warehouse:method
// responsibility: Tests whether Python file text contains a warehouse:file anchor marker
// actor: method_implementation
// role: implementation
// source_truth: implementation
function hasFileAnchor(text) {
  return FILE_ANCHOR_RE.test(stripBom(text));
}

// warehouse:method
// responsibility: Parses first warehouse:file anchor block from Python text lines array
// actor: method_implementation
// role: implementation
// source_truth: implementation
function parseFileAnchorLines(lines) {
  let start = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (/^#\s+warehouse:file\s*$/.test(lines[i].trim())) {
      start = i;
      break;
    }
  }
  if (start === -1) return null;

  const fields = {};
  let end = start;
  for (let i = start + 1; i < lines.length; i += 1) {
    const s = lines[i].trim();
    if (!s || !s.startsWith("#")) break;
    end = i;
    const m = s.match(/^#\s*([A-Za-z0-9_]+)\s*:\s*(.*?)\s*$/);
    if (m) fields[m[1]] = m[2].trim();
  }
  return { start, end, fields };
}

// warehouse:method
// responsibility: Parses and extracts warehouse:file anchor from Python file text
// actor: method_implementation
// role: implementation
// source_truth: implementation
function parseFileAnchor(text) {
  return parseFileAnchorLines(stripBom(text).split(/\r?\n/));
}

module.exports = { hasFileAnchor, parseFileAnchorLines, parseFileAnchor };
