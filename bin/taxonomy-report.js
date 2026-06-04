#!/usr/bin/env node
// warehouse:file
// responsibility: Orchestrates taxonomy report generation: parses CLI arguments, extracts top entries from distributions, compiles anchor coverage statistics by role and layer, formats and outputs snapshot
// actor: taxonomy_reporter
// role: reporter
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

const { buildReport } = require("../src/worker-bee/report");

// Load config from .worker-bee.json
let config = {};
const root = path.resolve(__dirname, "..");
const configPath = path.join(root, ".worker-bee.json");
if (fs.existsSync(configPath)) {
  config = JSON.parse(fs.readFileSync(configPath, "utf8"));
}

const DEFAULT_REPO_ROOT =
  process.env.WORKER_BEE_REPO_ROOT || config.repoRoot || "C:/source/repos/bpm/internal/ai-engine";
const DEFAULT_TARGET =
  config.defaultTarget ? path.resolve(DEFAULT_REPO_ROOT, config.defaultTarget) : DEFAULT_REPO_ROOT;

// warehouse:method
// responsibility: Parses command arguments for taxonomy report generation
// actor: argument_parser
// role: config_builder
// source_truth: implementation
function parseArgs(argv) {
  const args = { repoRoot: DEFAULT_REPO_ROOT, target: DEFAULT_TARGET, output: null, json: false };
  for (let i = 0; i < argv.length; i += 1) {
    const next = () => argv[++i];
    switch (argv[i]) {
      case "--repo-root": args.repoRoot = next(); break;
      case "--target": args.target = next(); break;
      case "--output": args.output = next(); break;
      case "--json": args.json = true; break;
      default: console.error(`Unknown argument: ${argv[i]}`); process.exit(1);
    }
  }
  return args;
}

// warehouse:method
// responsibility: Extracts top entries sorted by value
// actor: sorter
// role: utility
// source_truth: implementation
function topN(obj, n) {
  return Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n);
}

// warehouse:method
// responsibility: Orchestrates taxonomy report generation
// actor: report_generator
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

  const report = buildReport(target, repoRoot);

  if (args.output) {
    const out = path.resolve(args.output);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(report, null, 2), "utf8");
  }

  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
    return 0;
  }

  const s = report.summary;
  console.log(`Taxonomy report — ${report.repo_root}`);
  console.log(`  generated: ${report.generated_at}`);
  console.log(`  python files:        ${s.total_python}`);
  console.log(`  fully trustworthy:   ${s.fully_trustworthy_files}`);
  console.log(`  file anchors:        ${s.file_anchor.trustworthy} trustworthy, ${s.file_anchor.low_quality} low-quality, ${s.file_anchor.missing} missing`);
  console.log(`  method coverage:     ${s.methods.trustworthy}/${s.methods.total} methods trustworthy`);
  console.log(`  roles (trustworthy file anchors):`);
  for (const [role, count] of topN(s.by_role, 12)) console.log(`    ${String(count).padStart(5)}  ${role}`);
  if (args.output) console.log(`\n  written: ${path.resolve(args.output)}`);
  return 0;
}

process.exit(main());
