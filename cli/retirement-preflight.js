#!/usr/bin/env node
// warehouse:file
// responsibility: Run deterministic retirement preflight checks without moving or deleting candidate files
// actor: delivery_cli_operator
// role: entrypoint
// source_truth: taxonomy/loc-delivery-chain.json

const path = require("path");
const {
  buildRetirementPreflight,
  writeRetirementPreflightReport,
} = require("../src/observability/retirement-preflight");

// warehouse:method
// responsibility: Parse retirement preflight CLI arguments into root and candidate paths
function parseArgs(argv) {
  const args = { root: process.cwd(), reportsDir: "reports", candidates: [], help: false, write: true };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--root") args.root = argv[++i];
    else if (token === "--reports-dir") args.reportsDir = argv[++i];
    else if (token === "--no-write") args.write = false;
    else if (token === "-h" || token === "--help") args.help = true;
    else args.candidates.push(token);
  }
  return args;
}

// warehouse:method
// responsibility: Print retirement preflight usage guidance for operators
function printUsage() {
  console.log("Usage: retirement-preflight [--root <repo>] [--reports-dir <path>] [--no-write] <candidate-file> [...]");
}

// warehouse:method
// responsibility: Run the preflight, write visible reports, and print a JSON report for automation
function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help || args.candidates.length === 0) {
    printUsage();
    return args.help ? 0 : 1;
  }

  const root = path.resolve(args.root);
  const report = buildRetirementPreflight(root, args.candidates);
  const artifacts = args.write
    ? writeRetirementPreflightReport(root, report, { reportsDir: args.reportsDir })
    : null;
  if (artifacts) report.artifacts = artifacts;
  console.log(JSON.stringify(report, null, 2));
  return report.status === "pass" ? 0 : 1;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = { parseArgs, main };
