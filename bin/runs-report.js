// warehouse:file
// responsibility: Orchestrates worker-bee execution report generation by validating reports directory and routing to appropriate formatter
// actor: run_ledger
// role: report_router
// source_truth: implementation

const path = require("path");
const fs = require("fs");
const { parseArgs, readRuns, readRunDetails } = require("../src/reports/runs-loader");
const { renderMarkdown, renderSummary, renderRun } = require("../src/reports/runs-renderer");

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

  if (args.summary) {
    const runs = readRuns(reportsDir);

    if (args.output) {
      const markdown = renderMarkdown(runs);
      const outPath = path.resolve(args.output);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, markdown, "utf8");
      console.log(`Written: ${outPath}`);
      return 0;
    }

    renderSummary(runs, args.json);
  } else {
    const packets = readRunDetails(reportsDir, args.runId);
    renderRun(args.runId, packets, args.json);
  }

  return 0;
}

process.exit(main());
