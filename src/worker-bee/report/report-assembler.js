// warehouse:file
// responsibility: Assembles taxonomy report structure with schema version, timestamp, file anchors, method anchors, and coverage summary
// actor: worker_bee_infrastructure
// role: report_assembler
// source_truth: implementation

const { repoRelative } = require("../scan");

// warehouse:method
// responsibility: Assembles taxonomy report structure with schema version, timestamp, file anchors, method anchors, and coverage summary
// actor: method_implementation
// role: implementation
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
