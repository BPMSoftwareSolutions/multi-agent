// warehouse:file
// responsibility: Assembles taxonomy report from scanned files and summary metrics
// actor: worker_bee_infrastructure
// role: telemetry_evidence
// source_truth: implementation

const { repoRelative } = require("../scan");

// warehouse:method
// responsibility: Generates taxonomy report from file and method anchors with coverage metrics and quality assessment
// actor: worker_bee_infrastructure
// role: telemetry_evidence
// source_truth: implementation
function buildReport(root, repoRoot, { files, summary }) {
  return {
    schema: "taxonomy-report.v1",
    generated_at: new Date().toISOString(),
    repo_root: repoRelative(root, repoRoot) || ".",
    summary,
    files,
  };
}

module.exports = { buildReport };
