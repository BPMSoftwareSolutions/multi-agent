// warehouse:file
// responsibility: Coordinates main behavior with documented file and method taxonomy evidence
// actor: progress_snapshot
// role: reporter
// source_truth: implementation

const fs = require("fs");
const path = require("path");
const { readProgress, getRunMetadata } = require("../src/progress/log-parser");
const { validateData } = require("../src/progress/data-validator");
const { formatMarkdownReport } = require("../src/reports/progress-report-formatter");

const logFile = path.resolve(__dirname, "..", ".worker-bee.log");
const reportFile = path.resolve(__dirname, "..", "reports", "CURRENT-RUN.md");

// warehouse:method
// responsibility: Coordinates main behavior with documented file and method taxonomy evidence
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
    console.log(`✅ Snapshot captured: ${totalCompleted}/${metadata.totalNeeded} files`);
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  }
}

main();
