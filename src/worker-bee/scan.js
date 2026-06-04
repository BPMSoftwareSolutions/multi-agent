// warehouse:file
// responsibility: Scans filesystem for Python files, analyzes anchor state, applies file/method anchors with deterministic field computation
// actor: worker_bee_infrastructure
// role: script_executor
// source_truth: implementation

// Filesystem side of the worker-bee: find Python files that need a file anchor,
// compute the deterministic anchor fields, and write anchor blocks back.
//
// The directory skip list and the "# warehouse:file" detection mirror the python
// scanner so this process and the authoritative scanner agree on coverage.

const fs = require("fs");
const path = require("path");
const {
  FILE_ANCHOR_FIELD_ORDER,
  ROLE_VOCAB,
  SOURCE_TRUTH_VOCAB,
  MUTATION_POLICY_VOCAB,
} = require("./anchor-spec");
const {
  stripBom,
  repoRelative,
  computeRepoRootDepth,
  dominantEol,
  splitKeepEnds,
  isPlaceholder,
  isGenericResponsibility,
  normPath,
} = require("./text-utils");

// Mirrors SKIP_DIR_NAMES in taxonomy_comment_scanner.py.
const SKIP_DIRS = new Set([
  ".git",
  ".venv",
  ".mypy_cache",
  ".pytest_cache",
  "__pycache__",
  "build",
  "dist",
  "docs",
  "generated",
  "archive",
  "temp",
  "node_modules",
]);

const FILE_ANCHOR_RE = /^#\s+warehouse:file\s*$/m;

// warehouse:method
// responsibility: Recursively collects Python files in directory tree, skipping excluded folders
// actor: worker_bee_infrastructure
// role: file_scanner
// source_truth: implementation
function listPythonFiles(root) {
  const out = [];
  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (_err) {
      return;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        walk(path.join(dir, entry.name));
      } else if (entry.isFile() && entry.name.endsWith(".py")) {
        out.push(path.join(dir, entry.name));
      }
    }
  }
  walk(root);
  out.sort();
  return out;
}

// warehouse:method
// responsibility: Tests whether text contains a warehouse:file anchor marker
// actor: worker_bee_infrastructure
// role: anchor_detector
// source_truth: implementation
function hasFileAnchor(text) {
  return FILE_ANCHOR_RE.test(stripBom(text));
}

// Note: computeRepoRootDepth is imported from text-utils.js

// warehouse:method
// responsibility: Finds Python files missing file anchors with precomputed deterministic fields
// actor: worker_bee_infrastructure
// role: script_executor
// source_truth: implementation
function findMissing(root, repoRoot, { limit } = {}) {
  const files = listPythonFiles(root);
  const missing = [];
  for (const abs of files) {
    let text;
    try {
      text = fs.readFileSync(abs, "utf8");
    } catch (_err) {
      continue;
    }
    if (hasFileAnchor(text)) continue;
    const relPosix = repoRelative(abs, repoRoot);
    missing.push({
      absPath: abs,
      path: relPosix,
      expected_location: relPosix,
      repo_root_depth: computeRepoRootDepth(text, relPosix),
    });
    if (limit && missing.length >= limit) break;
  }
  return { totalPython: files.length, missing };
}

// warehouse:method
// responsibility: Assembles file-anchor comment block from model and deterministic fields
// actor: worker_bee_infrastructure
// role: script_executor
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

// Note: dominantEol and splitKeepEnds are imported from text-utils.js

// warehouse:method
// responsibility: Inserts anchor block after shebang/coding declaration at file start
// actor: worker_bee_infrastructure
// role: script_executor
// source_truth: implementation
function insertAnchor(absPath, anchorBlock) {
  const raw = fs.readFileSync(absPath, "utf8");
  if (hasFileAnchor(raw)) return false; // idempotent guard
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

// --- Anchor quality validation + replacement -------------------------------

// Note: isPlaceholder, isGenericResponsibility, and normPath are imported from text-utils.js

// warehouse:method
// responsibility: Parses first warehouse:file anchor block from lines array
// actor: worker_bee_infrastructure
// role: script_executor
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
// responsibility: Parses warehouse:file anchor from text
// actor: worker_bee_infrastructure
// role: script_executor
// source_truth: implementation
function parseFileAnchor(text) {
  return parseFileAnchorLines(stripBom(text).split(/\r?\n/));
}

// warehouse:method
// responsibility: Assesses file anchor for quality and consistency issues
// actor: worker_bee_infrastructure
// role: script_executor
// source_truth: implementation
function assessAnchor(fields, deterministic) {
  const issues = [];
  for (const key of FILE_ANCHOR_FIELD_ORDER) {
    if (isPlaceholder(fields[key])) issues.push(`${key}:missing_or_placeholder`);
  }
  if (fields.role && !ROLE_VOCAB.includes(fields.role)) issues.push("role:not_in_vocab");
  if (fields.source_truth && !SOURCE_TRUTH_VOCAB.includes(fields.source_truth)) {
    issues.push("source_truth:not_in_vocab");
  }
  if (fields.mutation_policy && !MUTATION_POLICY_VOCAB.includes(fields.mutation_policy)) {
    issues.push("mutation_policy:not_in_vocab");
  }
  if (fields.generated && !["true", "false"].includes(String(fields.generated).toLowerCase())) {
    issues.push("generated:not_bool");
  }
  if (fields.actor && /[A-Z ]/.test(fields.actor)) issues.push("actor:not_snake_case");
  if (isGenericResponsibility(fields.responsibility)) issues.push("responsibility:generic");
  if (fields.expected_location && normPath(fields.expected_location) !== normPath(deterministic.expected_location)) {
    issues.push("expected_location:mismatch");
  }
  if (String(fields.repo_root_depth) !== String(deterministic.repo_root_depth)) {
    issues.push("repo_root_depth:mismatch");
  }
  return issues;
}

// Matches a `# warehouse:file` anchor block: the marker line plus the following
// consecutive comment lines. Stops at the first blank or non-comment line.
const FILE_ANCHOR_BLOCK_RE = /[ \t]*#[ \t]+warehouse:file[ \t]*(?:\r?\n[ \t]*#[^\n]*)*/;

// warehouse:method
// responsibility: Replaces existing anchor in place or inserts if missing
// actor: worker_bee_infrastructure
// role: script_executor
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

// warehouse:method
// responsibility: Analyzes file for anchor state across file and method layers
// actor: worker_bee_infrastructure
// role: script_executor
// source_truth: implementation
function analyzeFile(absPath, repoRoot, { layer = "both", mode = "all" } = {}) {
  let raw;
  try {
    raw = fs.readFileSync(absPath, "utf8");
  } catch (_e) {
    return null;
  }
  const text = stripBom(raw);
  const relPosix = repoRelative(absPath, repoRoot);
  const deterministic = {
    expected_location: relPosix,
    repo_root_depth: computeRepoRootDepth(text, relPosix),
  };
  const lines = text.split(/\r?\n/);

  // File layer.
  const wantFile = layer === "file" || layer === "both";
  const parsed = parseFileAnchorLines(lines);
  const fileExisting = !!parsed;
  const fileIssues = parsed ? assessAnchor(parsed.fields, deterministic) : ["missing"];
  let fileNeed = false;
  if (wantFile) {
    const modeOk =
      mode === "all" ||
      (mode === "missing" && !fileExisting) ||
      (mode === "revalidate" && fileExisting);
    fileNeed = modeOk && (!fileExisting || fileIssues.length > 0);
  }

  // Method layer.
  const wantMethod = layer === "method" || layer === "both";
  let defs = [];
  const methodsNeeding = [];
  if (wantMethod) {
    const { findDefs, methodAnchorAbove, assessMethodAnchor } = require("./methods");
    defs = findDefs(lines);
    for (const d of defs) {
      const existing = methodAnchorAbove(lines, d.lineIdx);
      d.existing = existing;
      let reason = "missing";
      let issues = [];
      let needs = true;
      if (existing && existing.hasMarker) {
        issues = assessMethodAnchor(existing.fields);
        reason = "low_quality";
        needs = issues.length > 0;
      }
      const modeOk =
        mode === "all" ||
        (mode === "missing" && reason === "missing") ||
        (mode === "revalidate" && reason === "low_quality");
      d.needs = needs && modeOk;
      d.reason = reason;
      d.issues = issues;
      if (d.needs) methodsNeeding.push(d);
    }
  }

  return {
    absPath,
    path: relPosix,
    deterministic,
    fileExisting,
    fileIssues,
    fileNeed,
    defs,
    methodsNeeding,
    totalDefs: defs.length,
  };
}

// warehouse:method
// responsibility: Serializes work items to JSON-safe format for bee consumption
// actor: worker_bee_infrastructure
// role: script_executor
// source_truth: implementation
function serializeWork(work) {
  return work.map((w) => ({
    absPath: w.absPath,
    path: w.path,
    deterministic: w.deterministic,
    doFile: w.doFile,
    doMethods: w.doMethods,
    fileExisting: w.fileExisting,
    fileIssues: w.fileIssues,
    methodsNeeding: w.methodsNeeding.map((d) => ({
      id: d.id,
      name: d.name,
      indent: d.indent,
      lineIdx: d.lineIdx,
      existing: d.existing,
      reason: d.reason,
      issues: d.issues,
    })),
  }));
}

// warehouse:method
// responsibility: Finds files needing work across specified layers and modes
// actor: worker_bee_infrastructure
// role: script_executor
// source_truth: implementation
function findWork(root, repoRoot, { mode = "all", layer = "file", limit } = {}) {
  const files = listPythonFiles(root);
  const work = [];
  let trustworthy = 0;
  for (const abs of files) {
    const a = analyzeFile(abs, repoRoot, { layer, mode });
    if (!a) continue;
    const doFile = a.fileNeed;
    const doMethods = a.methodsNeeding.length > 0;
    if (doFile || doMethods) {
      work.push({ ...a, doFile, doMethods });
    } else {
      trustworthy += 1;
    }
    if (limit && work.length >= limit) break;
  }
  return { totalPython: files.length, trustworthy, work };
}

module.exports = {
  SKIP_DIRS,
  listPythonFiles,
  hasFileAnchor,
  stripBom,
  dominantEol,
  splitKeepEnds,
  repoRelative,
  computeRepoRootDepth,
  isPlaceholder,
  isGenericResponsibility,
  findMissing,
  findWork,
  serializeWork,
  analyzeFile,
  parseFileAnchor,
  assessAnchor,
  buildAnchorBlock,
  insertAnchor,
  replaceAnchor,
};
