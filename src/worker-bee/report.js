// warehouse:file
// responsibility: Generates read-only taxonomy reports from file and method anchors, computing coverage metrics and quality assessment
// actor: worker_bee_infrastructure
// role: telemetry_evidence
// source_truth: implementation

// Taxonomy report: a READ-ONLY projection built from the anchors currently in the
// source files. It is not a stateful ledger — it is regenerated from the files, so
// it can never drift from the truth. The anchors in the .py files are the ledger;
// this is just a queryable snapshot of them.

const fs = require("fs");
const {
  listPythonFiles,
  stripBom,
  repoRelative,
  computeRepoRootDepth,
  parseFileAnchor,
  assessAnchor,
} = require("./scan");
const { findDefs, methodAnchorAbove, assessMethodAnchor } = require("./methods");

// warehouse:method
// responsibility: Increments counter in map for given key
// actor: worker_bee_infrastructure
// role: infrastructure
// source_truth: implementation
function increment(map, key) {
  map[key] = (map[key] || 0) + 1;
}

// warehouse:method
// responsibility: Generates taxonomy report from file and method anchors with coverage metrics and quality assessment
// actor: worker_bee_infrastructure
// role: telemetry_evidence
// source_truth: implementation
function buildReport(root, repoRoot) {
  const paths = listPythonFiles(root);
  const files = [];
  const summary = {
    total_python: paths.length,
    file_anchor: { trustworthy: 0, low_quality: 0, missing: 0 },
    by_role: {},
    by_actor: {},
    methods: { total: 0, trustworthy: 0 },
    fully_trustworthy_files: 0,
  };

  for (const abs of paths) {
    let raw;
    try {
      raw = fs.readFileSync(abs, "utf8");
    } catch (_e) {
      continue;
    }
    const text = stripBom(raw);
    const relPosix = repoRelative(abs, repoRoot);
    const deterministic = {
      expected_location: relPosix,
      repo_root_depth: computeRepoRootDepth(text, relPosix),
    };

    const parsed = parseFileAnchor(text);
    let fileState;
    let fields = {};
    if (!parsed) {
      fileState = "missing";
    } else {
      fields = parsed.fields;
      fileState = assessAnchor(fields, deterministic).length ? "low_quality" : "trustworthy";
    }
    summary.file_anchor[fileState] += 1;
    if (fileState === "trustworthy") {
      if (fields.role) increment(summary.by_role, fields.role);
      if (fields.actor) increment(summary.by_actor, fields.actor);
    }

    // Method coverage.
    const lines = text.split(/\r?\n/);
    const defs = findDefs(lines);
    let methodTrustworthy = 0;
    for (const d of defs) {
      const existing = methodAnchorAbove(lines, d.lineIdx);
      if (existing && existing.hasMarker && assessMethodAnchor(existing.fields).length === 0) {
        methodTrustworthy += 1;
      }
    }
    summary.methods.total += defs.length;
    summary.methods.trustworthy += methodTrustworthy;

    const fileTrust = fileState === "trustworthy";
    const methodTrust = defs.length === 0 || methodTrustworthy === defs.length;
    if (fileTrust && methodTrust) summary.fully_trustworthy_files += 1;

    files.push({
      path: relPosix,
      file_anchor: fileState,
      role: fields.role || null,
      actor: fields.actor || null,
      responsibility: fields.responsibility || null,
      methods_total: defs.length,
      methods_trustworthy: methodTrustworthy,
    });
  }

  return {
    schema: "taxonomy-report.v1",
    generated_at: new Date().toISOString(),
    repo_root: repoRelative(root, repoRoot) || ".",
    summary,
    files,
  };
}

module.exports = { buildReport };
