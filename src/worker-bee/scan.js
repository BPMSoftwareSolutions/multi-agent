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

// Strip a leading UTF-8 BOM. A BOM before the first `#` hides an existing anchor
// from both this tool and the python scanner, and a BOM mid-file is a Python
// syntax error, so we normalize it away on every file we read or write.
function stripBom(text) {
  return text && text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

// Recursively collect *.py files under root, pruning skip dirs.
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

function hasFileAnchor(text) {
  return FILE_ANCHOR_RE.test(stripBom(text));
}

// Repo-relative posix path, used for the expected_location field.
function repoRelative(absPath, repoRoot) {
  return path.relative(repoRoot, absPath).split(path.sep).join("/");
}

// repo_root_depth: prefer an explicit Path(...).parents[N] literal already in the
// file (so the anchor matches the code). Otherwise use the directory depth, which
// is the parents[N] index that would resolve to the repo root.
function computeRepoRootDepth(text, relPosix) {
  const literal = text.match(/\.parents\[(\d+)\]/);
  if (literal) return parseInt(literal[1], 10);
  const parts = relPosix.split("/");
  return Math.max(parts.length - 1, 0);
}

// Find Python files under root that are missing a file anchor, with the
// deterministic fields precomputed for each.
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

// Assemble the anchor comment block from model fields + deterministic fields.
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

// Dominant newline of a file: CRLF if any CRLF is present, else LF.
function dominantEol(text) {
  return /\r\n/.test(text) ? "\r\n" : "\n";
}

// Split text into segments that each preserve their original line ending, so
// edits to a few lines don't churn the whole file's endings. Returns array of
// { text, eol }. The segment index aligns with a plain `split(/\r?\n/)` line index.
function splitKeepEnds(text) {
  const segments = [];
  const re = /([^\r\n]*)(\r\n|\r|\n|$)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    segments.push({ text: m[1], eol: m[2] });
    if (m[0] === "" && re.lastIndex >= text.length) break; // final empty match
    if (re.lastIndex === m.index && m[2] === "") break;
  }
  // The trailing "$" match appends one empty segment; drop it if it duplicates EOF.
  if (segments.length > 1) {
    const last = segments[segments.length - 1];
    if (last.text === "" && last.eol === "") segments.pop();
  }
  return segments;
}

// Insert the anchor block at the top of the file, after a shebang and/or coding
// cookie if present. Comments are legal before `from __future__`, so this is safe.
// Only the inserted region changes; the rest of the file is preserved byte-for-byte
// (aside from removing a leading BOM, which would otherwise break Python mid-file).
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

// Note: "none"/"n/a" are NOT placeholders — "None" is a legitimate value for an
// input/output contract (a no-arg method). Treating it as a placeholder caused
// non-convergence (the bee would rewrite a valid anchor forever).
const PLACEHOLDER_TOKENS = new Set([
  "",
  "auto",
  "unknown",
  "tbd",
  "todo",
  "placeholder",
  "xxx",
]);

function isPlaceholder(value) {
  if (value === undefined || value === null) return true;
  const v = String(value).trim().toLowerCase();
  if (PLACEHOLDER_TOKENS.has(v)) return true;
  if (v.startsWith("[") && v.endsWith("]")) return true;
  return false;
}

// A responsibility should be a human-readable description, not a placeholder and
// not just the symbol/file name restated. Rejects:
//  - placeholders ([auto], tbd, ...)
//  - identifier-style tokens with no spaces (e.g. load_anchor_contract_from_disk)
//    which is how the prior substrate run "filled" anchors — a name, not prose
//  - lazy two-word stubs ("client module", "x file")
function isGenericResponsibility(value) {
  if (isPlaceholder(value)) return true;
  const v = String(value).trim();
  if (v.length < 8) return true;
  // No whitespace at all => it's an identifier/name, not a description.
  if (!/\s/.test(v)) return true;
  // Mostly underscores with little prose (e.g. "do_thing here") also reads as a name.
  const lower = v.toLowerCase();
  const words = lower.split(/\s+/);
  if (words.length <= 2 && /(module|file|script|client|handler|util|utils|helper)$/.test(lower)) {
    return true;
  }
  return false;
}

function normPath(p) {
  return String(p || "").replace(/\\/g, "/").trim();
}

// Parse the first `# warehouse:file` anchor block out of an array of lines.
// Returns { start, end, fields } (inclusive line indices) or null.
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

function parseFileAnchor(text) {
  return parseFileAnchorLines(stripBom(text).split(/\r?\n/));
}

// Return a list of issue codes for an existing anchor. Empty list = trustworthy.
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

// Replace an existing anchor block in place with a new one, touching only the
// block region (and removing any leading BOM). Falls back to insertion if no
// anchor is present.
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

// Analyze one file across the requested layer(s). Returns a descriptor with the
// file-anchor state and the per-def method-anchor state, or null if unreadable.
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

// Trim work items to a JSON-serializable shape the bee can be driven from. The
// scanner writes this; the bee consumes it without re-scanning.
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

// Unified work finder. layer: "file" | "method" | "both". mode: "missing" |
// "revalidate" | "all". Returns files needing any work for the requested layers.
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
