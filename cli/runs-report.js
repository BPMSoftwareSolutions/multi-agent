// warehouse:file
// responsibility: Delegator: orchestrates worker-bee execution report generation by validating and routing requests
// actor: run_ledger
// role: report_router
// source_truth: implementation

const path = require("path");
const { parseArgs } = require("../src/reports/runs-loader");
const { loadWorkerBeeConfig } = require("../src/worker-bee/worker-bee-config-loader");
const { routeReportRequest } = require("../src/reports/run-report-router");

const root = path.resolve(__dirname, "..");
const reportsDir = path.join(root, "reports");

const config = loadWorkerBeeConfig(root);
const args = parseArgs(process.argv.slice(2));

const exitCode = routeReportRequest(reportsDir, args);
process.exit(exitCode);
