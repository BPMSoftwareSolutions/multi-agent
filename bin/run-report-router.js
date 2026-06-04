// warehouse:file
// responsibility: Routes worker-bee execution report requests to appropriate handler (summary or detail)
// actor: run_ledger
// role: report_router
// source_truth: implementation

const fs = require("fs");
const path = require("path");
const { renderMarkdown, renderSummary, renderRun } = require("../src/reports/runs-renderer");
const { readRuns, readRunDetails } = require("../src/reports/runs-loader");

function routeReportRequest(reportsDir, args) {
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

module.exports = { routeReportRequest };
