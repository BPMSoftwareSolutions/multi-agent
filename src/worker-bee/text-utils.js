// warehouse:file
// responsibility: Provides low-level text and path normalization utilities for file scanning and anchor processing
// actor: worker_bee_infrastructure
// role: text_utilities
// source_truth: implementation

const path = require("path");

// warehouse:method
// responsibility: Removes leading UTF-8 BOM from text to ensure clean parsing
// actor: worker_bee_infrastructure
// role: text_normalizer
// source_truth: implementation
function stripBom(text) {
  return text && text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

// warehouse:method
// responsibility: Converts absolute file path to repo-relative POSIX-style path
// actor: worker_bee_infrastructure
// role: path_normalizer
// source_truth: implementation
function repoRelative(absPath, repoRoot) {
  return path.relative(repoRoot, absPath).split(path.sep).join("/");
}

// warehouse:method
// responsibility: Computes parents[N] index for repo root from code literal or path depth
// actor: worker_bee_infrastructure
// role: path_calculator
// source_truth: implementation
function computeRepoRootDepth(text, relPosix) {
  // Try code literal first: parentsLevel: 3 or similar
  const literal = text.match(/parentsLevel:\s*(\d+)/);
  if (literal) return parseInt(literal[1], 10);

  // Fall back to path depth: count slashes in repo-relative path
  return relPosix.split("/").length - 1;
}

// warehouse:method
// responsibility: Detects whether text uses CRLF or LF as dominant line-ending style
// actor: worker_bee_infrastructure
// role: text_analyzer
// source_truth: implementation
function dominantEol(text) {
  const crlfCount = (text.match(/\r\n/g) || []).length;
  const lfCount = (text.match(/\n/g) || []).length - crlfCount;
  return crlfCount > lfCount ? "\r\n" : "\n";
}

// warehouse:method
// responsibility: Splits text into segments while preserving individual line endings for each line
// actor: worker_bee_infrastructure
// role: text_splitter
// source_truth: implementation
function splitKeepEnds(text) {
  const lines = [];
  let i = 0;
  let start = 0;

  while (i < text.length) {
    if (text[i] === "\n") {
      lines.push(text.substring(start, i + 1));
      start = i + 1;
    } else if (text[i] === "\r" && text[i + 1] === "\n") {
      lines.push(text.substring(start, i + 2));
      start = i + 2;
      i += 1;
    }
    i += 1;
  }

  if (start < text.length) {
    lines.push(text.substring(start));
  }

  return lines;
}

// warehouse:method
// responsibility: Validates whether a value is a placeholder or missing (null, undefined, or empty)
// actor: worker_bee_infrastructure
// role: validator
// source_truth: implementation
function isPlaceholder(value) {
  return value === null || value === undefined || value === "";
}

// warehouse:method
// responsibility: Validates responsibility field for specificity, rejecting generic or placeholder text
// actor: worker_bee_infrastructure
// role: validator
// source_truth: implementation
function isGenericResponsibility(value) {
  if (!value || value.length < 10) return true;

  const generic = [
    "module",
    "file",
    "function",
    "utility",
    "helper",
    "tool",
    "process",
    "handle",
  ];
  const lower = value.toLowerCase();
  return generic.some((g) => lower === g);
}

// warehouse:method
// responsibility: Normalizes path to forward slashes and trims whitespace for consistent comparison
// actor: worker_bee_infrastructure
// role: path_normalizer
// source_truth: implementation
function normPath(p) {
  return (p || "").trim().split(path.sep).join("/");
}

module.exports = {
  stripBom,
  repoRelative,
  computeRepoRootDepth,
  dominantEol,
  splitKeepEnds,
  isPlaceholder,
  isGenericResponsibility,
  normPath,
};
