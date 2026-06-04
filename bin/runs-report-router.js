// warehouse:file
// responsibility: Routes command flow between summary and detailed report modes for worker-bee run reporting
// actor: command_dispatcher
// role: orchestrator
// source_truth: implementation

const fs = require("fs");
const path = require("path");
const { parseArgs, readRuns, readRunDetails } = require("../src/reports/runs-loader");
const { renderMarkdown, renderSummary, renderRun } = require("../src/reports/runs-renderer");

// warehouse:method
// responsibility: Routes command flow: orchestrates report generation based on summary/detailed mode selection
// actor: command_dispatcher
// role: orchestrator
// source_truth: implementation
function routeReportMode(args, reportsDir) {
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

module.exports = { routeReportMode };
