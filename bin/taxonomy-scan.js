#!/usr/bin/env node
// warehouse:file
// responsibility: Orchestrates taxonomy scan workflow: parses args, scans target, generates and persists tracking JSON
// actor: taxonomy_scanner
// role: orchestrator
// source_truth: implementation

const path = require("path");
const fs = require("fs");

const { findWork } = require("../src/worker-bee/scan");
const { parseArgs, DEFAULT_REPO_ROOT } = require("../src/worker-bee/scan-argument-parser");
const { generateTracking, writeTracking, reportTracking } = require("../src/worker-bee/tracking-generator");

// warehouse:method
// responsibility: Orchestrates taxonomy scan workflow: validates target, generates tracking, persists and reports
// actor: taxonomy_scanner
// role: orchestrator
// source_truth: implementation
function main() {
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = path.resolve(args.repoRoot);
  const target = path.resolve(args.target || args.repoRoot);
  if (!fs.existsSync(target)) {
    console.error(`Target does not exist: ${target}`);
    return 1;
  }

  const scanResults = findWork(target, repoRoot, { layer: args.layer, mode: args.mode });
  const tracking = generateTracking(args, scanResults, repoRoot, target);
  const out = path.resolve(args.output || path.join(__dirname, "..", "reports", "taxonomy-tracking.json"));
  writeTracking(tracking, out);
  reportTracking(tracking, out, args.json);
  return 0;
}

process.exit(main());
