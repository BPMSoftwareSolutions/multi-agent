// warehouse:file
// responsibility: Provides assessAnchor, analyzeFile, findMissing functionality
// actor: worker_bee_infrastructure
// role: auditor
// source_truth: implementation

const fs = require("fs");
const { FILE_ANCHOR_FIELD_ORDER, ROLE_VOCAB, SOURCE_TRUTH_VOCAB, MUTATION_POLICY_VOCAB } = require("../anchor-spec");
const { stripBom, repoRelative, computeRepoRootDepth, isPlaceholder, isGenericResponsibility, normPath } = require("../text-utils");
const { listPythonFiles } = require("./file-discoverer");
const { parseFileAnchorLines } = require("./anchor-parser");

// warehouse:method
// responsibility: Assesses anchor completeness by validating all fields, checking vocabulary constraints, and detecting consistency issues
// actor: method_implementation
// role: implementation
// source_truth: implementation
function assessAnchor(fields, deterministic) {
  const issues = [];
  for (const key of FILE_ANCHOR_FIELD_ORDER) {
    if (isPlaceholder(fields[key])) issues.push(`${key}:missing_or_placeholder`);
  }
  if (fields.role && !ROLE_VOCAB.includes(fields.role)) issues.push("role:not_in_vocab");
  if (fields.source_truth && !SOURCE_TRUTH_VOCAB.includes(fields.source_truth)) issues.push("source_truth:not_in_vocab");
  if (fields.mutation_policy && !MUTATION_POLICY_VOCAB.includes(fields.mutation_policy)) issues.push("mutation_policy:not_in_vocab");
  if (fields.generated && !["true", "false"].includes(String(fields.generated).toLowerCase())) issues.push("generated:not_bool");
  if (fields.actor && /[A-Z ]/.test(fields.actor)) issues.push("actor:not_snake_case");
  if (isGenericResponsibility(fields.responsibility)) issues.push("responsibility:generic");
  if (fields.expected_location && normPath(fields.expected_location) !== normPath(deterministic.expected_location)) issues.push("expected_location:mismatch");
  if (String(fields.repo_root_depth) !== String(deterministic.repo_root_depth)) issues.push("repo_root_depth:mismatch");
  return issues;
}

// warehouse:method
// responsibility: Analyzes Python file for anchor completeness across file and method layers, identifies missing and low-quality work items
// actor: method_implementation
// role: implementation
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

  const wantFile = layer === "file" || layer === "both";
  const parsed = parseFileAnchorLines(lines);
  const fileExisting = !!parsed;
  const fileIssues = parsed ? assessAnchor(parsed.fields, deterministic) : ["missing"];
  let fileNeed = false;
  if (wantFile) {
    const modeOk = mode === "all" || (mode === "missing" && !fileExisting) || (mode === "revalidate" && fileExisting);
    fileNeed = modeOk && (!fileExisting || fileIssues.length > 0);
  }

  const wantMethod = layer === "method" || layer === "both";
  let defs = [];
  const methodsNeeding = [];
  if (wantMethod) {
    const { findDefs, methodAnchorAbove, assessMethodAnchor } = require("../methods");
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
      const modeOk = mode === "all" || (mode === "missing" && reason === "missing") || (mode === "revalidate" && reason === "low_quality");
      d.needs = needs && modeOk;
      d.reason = reason;
      d.issues = issues;
      if (d.needs) methodsNeeding.push(d);
    }
  }

  return { absPath, path: relPosix, deterministic, fileExisting, fileIssues, fileNeed, defs, methodsNeeding, totalDefs: defs.length };
}

// warehouse:method
// responsibility: Finds Python files missing file anchors and precomputes deterministic audit fields for work planning
// actor: method_implementation
// role: implementation
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
    const parsed = parseFileAnchorLines(stripBom(text).split(/\r?\n/));
    if (parsed) continue;
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
// responsibility: Finds Python files needing anchor work across layers, audits completeness issues, and categorizes work items for bee task planning
// actor: method_implementation
// role: implementation
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

module.exports = { assessAnchor, analyzeFile, findMissing, findWork };
