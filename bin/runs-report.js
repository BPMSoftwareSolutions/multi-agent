// warehouse:file
// responsibility: Orchestrates worker-bee execution report generation by validating reports directory and routing to appropriate formatter
// actor: run_ledger
// role: report_router
// source_truth: implementation

const path = require("path");
const fs = require("fs");
const { parseArgs } = require("../src/reports/runs-loader");
const { routeReportMode } = require("./runs-report-router");

const root = path.resolve(__dirname, "..");
const reportsDir = path.join(root, "reports");

let config = {};
const configPath = path.join(root, ".worker-bee.json");
if (fs.existsSync(configPath)) {
  config = JSON.parse(fs.readFileSync(configPath, "utf8"));
}

// warehouse:method
// responsibility: Orchestrates worker-bee execution report by validating reports directory and routing to renderer
// actor: method_implementation
// role: implementation
// source_truth: implementation
function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(reportsDir)) {
    console.log("No reports directory yet. Run a worker-bee command first.");
    return 0;
  }

  return routeReportMode(args, reportsDir);
}

process.exit(main());
