// warehouse:file
// responsibility: Orchestrates progress snapshot generation by reading logs, validating metrics, and writing formatted markdown reports
// actor: progress_snapshot
// role: reporter
// source_truth: implementation

const fs = require("fs");
const path = require("path");
const { readProgress, getRunMetadata } = require("../src/progress/log-parser");
const { formatMarkdownReport } = require("./snapshot-formatter");

const logFile = path.resolve(__dirname, "..", ".worker-bee.log");
const reportFile = path.resolve(__dirname, "..", "reports", "CURRENT-RUN.md");

// warehouse:method
// responsibility: Generates progress snapshot: reads completion log, validates metrics, writes formatted markdown report
// actor: method_implementation
// role: implementation
// source_truth: implementation
function main() {
  try {
    const { totalCompleted, completions, totalErrors } = readProgress();
    const metadata = getRunMetadata();

    // Validate data before generating report
    const validationErrors = validateData(totalCompleted, metadata);
    if (validationErrors.length > 0) {
      console.error(`❌ Data validation failed:`);
      validationErrors.forEach((err) => console.error(`   - ${err}`));
      console.error(`\n   Metadata: totalNeeded=${metadata.totalNeeded}, totalCompleted=${totalCompleted}`);
      process.exit(1);
    }

    const report = formatMarkdownReport(totalCompleted, completions, metadata, totalErrors);

    // Ensure reports directory exists
    const reportsDir = path.dirname(reportFile);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    fs.writeFileSync(reportFile, report, "utf8");
    const pct = Math.round((totalCompleted / metadata.totalNeeded) * 100);
    console.log(`✅ Updated: ${reportFile}`);
    console.log(`   ${totalCompleted}/${metadata.totalNeeded} files (${pct}% progress)`);
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  }
}

main();
