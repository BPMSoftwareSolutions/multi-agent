// warehouse:file
// responsibility: Orchestrates taxonomy report generation: parses arguments, compiles coverage statistics, formats output
// actor: reporter
// role: report_generator
// source_truth: implementation

// Generate a taxonomy report (read-only projection) from the anchors currently in
// a target subtree. This is the "lights on" snapshot: what's anchored, by role,
// business_logic vs boundary_fabric, method coverage. It rescans the files each
// time, so it never drifts from the truth.
//
// Usage:
//   node bin/taxonomy-report.js --target <pkg> [--output reports/taxonomy.json] [--json]

const path = require("path");
const fs = require("fs");
const { parseReportArgs } = require("./report-builder");
const { outputReport } = require("./results-formatter");
const { buildReport } = require("../src/worker-bee/report");

// Load config from .worker-bee.json
let config = {};
const root = path.resolve(__dirname, "..");
const configPath = path.join(root, ".worker-bee.json");
if (fs.existsSync(configPath)) {
  config = JSON.parse(fs.readFileSync(configPath, "utf8"));
}

const DEFAULT_REPO_ROOT = process.env.WORKER_BEE_REPO_ROOT || config.repoRoot;
if (!DEFAULT_REPO_ROOT) {
  console.error('❌ Missing repo root configuration. Set WORKER_BEE_REPO_ROOT env var or .worker-bee.json repoRoot');
  process.exit(1);
}
const DEFAULT_TARGET =
  config.defaultTarget ? path.resolve(DEFAULT_REPO_ROOT, config.defaultTarget) : DEFAULT_REPO_ROOT;

// warehouse:method
// responsibility: Orchestrates taxonomy report generation: parses arguments, compiles coverage statistics, formats output
// actor: method_implementation
// role: implementation
// source_truth: implementation
function main() {
  const args = parseReportArgs(process.argv.slice(2), DEFAULT_REPO_ROOT, DEFAULT_TARGET);
  const repoRoot = path.resolve(args.repoRoot);
  const target = path.resolve(args.target || args.repoRoot);
  if (!fs.existsSync(target)) {
    console.error(`Target does not exist: ${target}`);
    return 1;
  }

  const report = buildReport(target, repoRoot);
  outputReport(report, args.output, args.json);
  return 0;
}

process.exit(main());
