#!/usr/bin/env node
// warehouse:file
// responsibility: Generates taxonomy healing swarm run observability report artifacts from batch healing evidence JSON input
// actor: taxonomy_swarm_report_cli
// role: report_generator
// source_truth: implementation

const fs = require("fs");
const path = require("path");
const {
  buildSwarmRunReport,
  writeSwarmRunReport,
} = require("../src/observability/taxonomy-swarm-report");

// warehouse:method
// responsibility: Generates taxonomy healing swarm run observability report artifacts from batch healing evidence JSON input
// actor: method_implementation
// role: implementation
// source_truth: implementation
function parseArgs(argv) {
  const inputPath = argv[2];
  const reportsDir = argv[3];
  return { inputPath, reportsDir };
}

// warehouse:method
// responsibility: Generates taxonomy healing swarm run observability report artifacts from batch healing evidence JSON input
// actor: method_implementation
// role: implementation
// source_truth: implementation
function readInput(inputPath) {
  return JSON.parse(fs.readFileSync(path.resolve(inputPath), "utf8"));
}

// warehouse:method
// responsibility: Generates taxonomy healing swarm run observability report artifacts from batch healing evidence JSON input
// actor: method_implementation
// role: implementation
// source_truth: implementation
function runTaxonomyHealSwarmReport(argv = process.argv, root = path.resolve(__dirname, "..")) {
  const { inputPath, reportsDir } = parseArgs(argv);
  if (!inputPath) {
    console.error("Usage: node bin/taxonomy-heal-swarm-report.js <swarm-evidence.json> [reports-dir]");
    return 1;
  }
  const report = buildSwarmRunReport(readInput(inputPath));
  const outputPaths = writeSwarmRunReport(report, path.resolve(reportsDir || path.join(root, "reports")));
  console.log(`Taxonomy healing swarm report: ${report.status}`);
  console.log(`Run ID: ${report.run_id}`);
  console.log(`Batch markdown: ${outputPaths.batch_report_markdown}`);
  console.log(`Current run: ${path.resolve(reportsDir || path.join(root, "reports"), "CURRENT-RUN.md")}`);
  return 0;
}

if (require.main === module) {
  try {
    process.exit(runTaxonomyHealSwarmReport());
  } catch (error) {
    console.error(`Taxonomy healing swarm report failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  parseArgs,
  readInput,
  runTaxonomyHealSwarmReport,
};
