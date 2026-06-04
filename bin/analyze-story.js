// warehouse:file
// responsibility: CLI entry point that delegates story coherence analysis to reporter module
// actor: cli
// role: delegator
// source_truth: implementation

const path = require("path");
const { analyzeAllFiles, computeHealthMetrics } = require("./story-analyzer");
const { writeAnalysisReport, displayAnalysisReport } = require("./analysis-formatter");

// warehouse:method
// responsibility: Orchestrates coherence analysis workflow by loading taxonomy data, generating report, and writing narrative findings
// actor: method_implementation
// role: implementation
// source_truth: implementation
function main() {
  const taxonomyPath = path.resolve(__dirname, "..", "reports", "taxonomy-extracted.json");

  console.log("🔍 Analyzing story coherence...\n");

  const analyses = analyzeAllFiles(taxonomyPath);
  const report = computeHealthMetrics(analyses);
  const reportFile = writeAnalysisReport(report, taxonomyPath);
  displayAnalysisReport(report, reportFile);
}

if (require.main === module) {
  main();
}
