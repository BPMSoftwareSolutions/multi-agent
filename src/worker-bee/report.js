// warehouse:file
// responsibility: Delegates report operations (file scanning, report assembly) to focused modules
// actor: worker_bee_infrastructure
// role: telemetry_evidence
// source_truth: implementation

// Taxonomy report: a READ-ONLY projection built from the anchors currently in the
// source files. It is not a stateful ledger — it is regenerated from the files, so
// it can never drift from the truth. The anchors in the .py files are the ledger;
// this is just a queryable snapshot of them.

const { scanFiles } = require("./report/file-scanner");
const { buildReport } = require("./report/report-builder");

module.exports = {
  buildReport: (root, repoRoot) => buildReport(root, repoRoot, scanFiles(root, repoRoot)),
};
