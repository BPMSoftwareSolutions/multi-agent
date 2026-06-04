// warehouse:file
// responsibility: Delegator: fetches run status and writes markdown executive summary
// actor: run_reporter
// role: reporter
// source_truth: implementation

const fs = require("fs");
const path = require("path");
const { getCurrentStatus } = require("../src/reports/run-status-loader");
const { formatSummary } = require("../src/reports/run-summary-formatter");

const summary = formatSummary(getCurrentStatus());
const outputPath = path.resolve(__dirname, "..", "reports", "CURRENT-RUN.md");
fs.writeFileSync(outputPath, summary, "utf8");
console.log(`Updated: ${outputPath}`);
