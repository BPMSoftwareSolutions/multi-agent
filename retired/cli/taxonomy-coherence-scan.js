// warehouse:file
// responsibility: Generates read only taxonomy coherence scan report artifacts for a target path with latest root report copies
// actor: taxonomy_scan_report_cli
// role: report_generator
// source_truth: implementation

const path = require("path");
const {
  buildScanReport,
  scanTargetPath,
  writeScanReport,
} = require("../src/observability/taxonomy-scan-report");

// warehouse:method
// responsibility: Generates read only taxonomy coherence scan report artifacts for a target path with latest root report copies
// actor: method_implementation
// role: implementation
// source_truth: implementation
function newRunId() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

// warehouse:method
// responsibility: Generates read only taxonomy coherence scan report artifacts for a target path with latest root report copies
// actor: method_implementation
// role: implementation
// source_truth: implementation
function parseArgs(argv) {
  const targetPath = argv[2];
  const reportsDir = argv[3];
  return { targetPath, reportsDir };
}

// warehouse:method
// responsibility: Generates read only taxonomy coherence scan report artifacts for a target path with latest root report copies
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatDuration(startedMs, completedMs) {
  return `${((completedMs - startedMs) / 1000).toFixed(1)}s`;
}

// warehouse:method
// responsibility: Generates read only taxonomy coherence scan report artifacts for a target path with latest root report copies
// actor: method_implementation
// role: implementation
// source_truth: implementation
function runTaxonomyCoherenceScan(argv = process.argv, root = path.resolve(__dirname, "..")) {
  const { targetPath, reportsDir } = parseArgs(argv);
  if (!targetPath) {
    console.error("Usage: node bin/taxonomy-coherence-scan.js <target-path> [reports-dir]");
    return 1;
  }

  const startedMs = Date.now();
  const startedAt = new Date(startedMs).toISOString();
  const scan = scanTargetPath(targetPath, root);
  const completedMs = Date.now();
  const completedAt = new Date(completedMs).toISOString();
  const report = buildScanReport({
    run_id: `scan-${newRunId()}`,
    status: "complete",
    target_path: scan.target_path,
    started_at: startedAt,
    completed_at: completedAt,
    duration: formatDuration(startedMs, completedMs),
    generated_at: completedAt,
    files: scan.files,
  });
  const outputPaths = writeScanReport(report, path.resolve(reportsDir || path.join(root, "reports")));

  console.log(`Taxonomy coherence scan: ${report.status}`);
  console.log(`Target path: ${report.target_path}`);
  console.log(`Folder coherence: ${report.summary.folder_coherence}/100`);
  console.log(`Latest markdown: ${outputPaths.latest_report_markdown}`);
  console.log(`Current run: ${path.resolve(reportsDir || path.join(root, "reports"), "CURRENT-RUN.md")}`);
  return 0;
}

if (require.main === module) {
  try {
    process.exit(runTaxonomyCoherenceScan());
  } catch (error) {
    console.error(`Taxonomy coherence scan failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  formatDuration,
  newRunId,
  parseArgs,
  runTaxonomyCoherenceScan,
};
