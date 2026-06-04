// warehouse:file
// responsibility: Orchestrates coherence analysis workflow: loads taxonomy, analyzes files, persists and renders report
// actor: coherence_analyzer
// role: orchestrator
// source_truth: implementation

const fs = require("fs");
const path = require("path");
const { aggregateAnalysis } = require("./coherence-analyzer");
const { writeReportFile, printReport } = require("./coherence-reporter");

// warehouse:method
// responsibility: undefined
// actor: undefined
// role: undefined
// source_truth: implementation

function main() {
  const taxonomyPath = path.resolve(__dirname, "..", "..", "reports", "taxonomy-extracted.json");

  if (!fs.existsSync(taxonomyPath)) {
    console.error(`❌ Error: ${taxonomyPath} not found`);
    console.error("Run: node bin/extract-taxonomy.js");
    process.exit(1);
  }

  console.log("🔍 Analyzing story coherence...\n");

  const taxonomyData = JSON.parse(fs.readFileSync(taxonomyPath, "utf8"));
  const report = aggregateAnalysis(taxonomyData);
  const reportFile = writeReportFile(report, taxonomyPath);
  printReport(report, reportFile);
}

module.exports = { aggregateAnalysis, main };

if (require.main === module) {
  main();
}
