#!/usr/bin/env node
// warehouse:file
// responsibility: Generates worker-bee execution reports: parses CLI args, loads historical runs and results, extracts metrics, formats markdown and console output with aggregates and per-run summaries
// actor: run_ledger
// role: reporter
// source_truth: implementation

// Worker-bee runs report: query the execution history and aggregate statistics.
//
// Usage:
//   node bin/runs-report.js                    # Summary of all runs
//   node bin/runs-report.js --run <run_id>     # Details for a specific run
//   node bin/runs-report.js --json             # Machine-readable output

const path = require("path");
const fs = require("fs");

const root = path.resolve(__dirname, "..");
const reportsDir = path.join(root, "reports");

// Load config from .worker-bee.json
let config = {};
const configPath = path.join(root, ".worker-bee.json");
if (fs.existsSync(configPath)) {
  config = JSON.parse(fs.readFileSync(configPath, "utf8"));
}

// warehouse:method
// responsibility: Parses command-line arguments for run filtering, output format, and file destination
// actor: argument_parser
// role: config_builder
// source_truth: implementation
function parseArgs(argv) {
  const args = { summary: true, runId: null, json: false, output: null };
  for (let i = 0; i < argv.length; i += 1) {
    const next = () => argv[++i];
    switch (argv[i]) {
      case "--run": args.runId = next(); args.summary = false; break;
      case "--json": args.json = true; break;
      case "--output": args.output = next(); break;
      default: console.error(`Unknown argument: ${argv[i]}`); process.exit(1);
    }
  }
  return args;
}

// warehouse:method
// responsibility: Loads all historical worker-bee runs from JSONL file and parses each line into run objects
// actor: run_loader
// role: data_reader
// source_truth: implementation
function readRuns() {
  const runsPath = path.join(reportsDir, "runs.jsonl");
  if (!fs.existsSync(runsPath)) return [];
  const lines = fs.readFileSync(runsPath, "utf8").trim().split("\n");
  return lines.map((line) => {
    try {
      return JSON.parse(line);
    } catch (_e) {
      return null;
    }
  }).filter(Boolean);
}

// warehouse:method
// responsibility: Loads all packet results for a specific run from the runs directory structure
// actor: packet_loader
// role: data_reader
// source_truth: implementation
function readRunDetails(runId) {
  const runDir = path.join(reportsDir, "runs", runId);
  if (!fs.existsSync(runDir)) return null;

  const packets = [];
  const files = fs.readdirSync(runDir).filter(f => f.startsWith("packet-") && f.endsWith(".json"));
  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(runDir, file), "utf8"));
      packets.push(data);
    } catch (_e) {
      // skip unparseable packets
    }
  }
  return packets;
}

// warehouse:method
// responsibility: Extracts and calculates key metrics from a run record including coverage percentage
// actor: metrics_calculator
// role: summarizer
// source_truth: implementation
function summarizeRun(run) {
  const touched = (run.tally?.anchored || 0) + (run.tally?.updated || 0) + (run.tally?.methods_only || 0) + (run.tally?.planned || 0);
  const total = run.totalPython || 0;
  const coverage = total > 0 ? ((touched / total) * 100).toFixed(1) : 0;
  return {
    ts: run.ts,
    run_id: run.run_id || '(unnamed)',
    target: run.target,
    layer: run.layer,
    agents: run.agents,
    files_per_packet: run.files_per_packet,
    totalPython: total,
    anchored: run.tally?.anchored || 0,
    updated: run.tally?.updated || 0,
    methods_only: run.tally?.methods_only || 0,
    planned: run.tally?.planned || 0,
    total_touched: touched,
    coverage_pct: coverage,
    errors: run.outstanding_errors || 0,
    methods: run.tally?.methods || 0,
    elapsed_sec: run.elapsed_seconds || 0,
  };
}

// warehouse:method
// responsibility: Generates markdown-formatted report with all-time aggregates, recent runs table, and per-target summary
// actor: report_builder
// role: formatter
// source_truth: implementation
function renderMarkdown(runs) {
  const lines = [];
  lines.push("# Worker-Bee Runs Report");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");

  if (runs.length === 0) {
    lines.push("No runs yet. Run: `node bin/worker-bee.js <target>`");
    return lines.join("\n");
  }

  lines.push(`## Summary`);
  lines.push("");
  lines.push(`- **Total runs**: ${runs.length}`);
  lines.push("");

  // Aggregates across all runs
  let totalAnchored = 0, totalUpdated = 0, totalMethodsOnly = 0, totalPlanned = 0;
  let totalMethods = 0, totalErrors = 0, totalElapsed = 0;
  let maxPythonSeen = 0;

  for (const run of runs) {
    totalAnchored += run.tally?.anchored || 0;
    totalUpdated += run.tally?.updated || 0;
    totalMethodsOnly += run.tally?.methods_only || 0;
    totalPlanned += run.tally?.planned || 0;
    totalMethods += run.tally?.methods || 0;
    totalErrors += run.outstanding_errors || 0;
    totalElapsed += run.elapsed_seconds || 0;
    maxPythonSeen = Math.max(maxPythonSeen, run.totalPython || 0);
  }

  const totalTouched = totalAnchored + totalUpdated + totalMethodsOnly + totalPlanned;
  const coveragePct = maxPythonSeen > 0 ? ((totalTouched / maxPythonSeen) * 100).toFixed(1) : 0;

  lines.push(`### All-Time Aggregates`);
  lines.push("");
  lines.push(`| Metric | Count |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Total Python files in target | ${maxPythonSeen} |`);
  lines.push(`| Files anchored | ${totalAnchored} |`);
  lines.push(`| Files updated | ${totalUpdated} |`);
  lines.push(`| Files methods-only | ${totalMethodsOnly} |`);
  lines.push(`| Files planned | ${totalPlanned} |`);
  lines.push(`| **Total files touched** | **${totalTouched}** |`);
  lines.push(`| **Coverage** | **${coveragePct}%** |`);
  lines.push(`| Method anchors written | ${totalMethods} |`);
  lines.push(`| Outstanding errors | ${totalErrors} |`);
  lines.push(`| Total elapsed time | ${totalElapsed}s |`);
  lines.push("");

  // Recent runs table
  lines.push(`## Recent Runs`);
  lines.push("");
  lines.push(`| Date | Target | Python | Touched | Coverage | Methods | Errors | Time |`);
  lines.push(`|------|--------|--------|---------|----------|---------|--------|------|`);

  const recentRuns = runs.slice(-20).reverse();
  for (const run of recentRuns) {
    const s = summarizeRun(run);
    const dt = new Date(run.ts).toLocaleString();
    const errorMark = s.errors > 0 ? `⚠ ${s.errors}` : "—";

    lines.push(`| ${dt} | ${s.target} | ${s.totalPython} | ${s.total_touched} | ${s.coverage_pct}% | ${s.methods} | ${errorMark} | ${s.elapsed_sec}s |`);
  }

  lines.push("");

  // Per-target summary
  const byTarget = {};
  for (const run of runs) {
    if (!byTarget[run.target]) {
      byTarget[run.target] = { python: 0, anchored: 0, updated: 0, methods: 0, errors: 0, runs: 0 };
    }
    byTarget[run.target].python = Math.max(byTarget[run.target].python, run.totalPython || 0);
    byTarget[run.target].anchored += run.tally?.anchored || 0;
    byTarget[run.target].updated += run.tally?.updated || 0;
    byTarget[run.target].methods += run.tally?.methods || 0;
    byTarget[run.target].errors += run.outstanding_errors || 0;
    byTarget[run.target].runs += 1;
  }

  lines.push(`## By Target`);
  lines.push("");
  lines.push(`| Target | Runs | Python | Touched | Coverage | Methods | Errors |`);
  lines.push(`|--------|------|--------|---------|----------|---------|--------|`);

  for (const [target, stats] of Object.entries(byTarget).sort()) {
    const touched = stats.anchored + stats.updated;
    const coverage = stats.python > 0 ? ((touched / stats.python) * 100).toFixed(1) : 0;
    const errorMark = stats.errors > 0 ? `⚠ ${stats.errors}` : "—";
    lines.push(`| ${target} | ${stats.runs} | ${stats.python} | ${touched} | ${coverage}% | ${stats.methods} | ${errorMark} |`);
  }

  return lines.join("\n");
}

// warehouse:method
// responsibility: Outputs console-formatted run history with JSON option, aggregating last 10 runs
// actor: output_formatter
// role: display_engine
// source_truth: implementation
function renderSummary(runs, json) {
  if (json) {
    console.log(JSON.stringify({
      total_runs: runs.length,
      runs: runs.map(summarizeRun),
    }, null, 2));
    return;
  }

  if (runs.length === 0) {
    console.log("No runs yet. Run: node bin/worker-bee.js <target>");
    return;
  }

  console.log(`Worker-bee runs history`);
  console.log(`  total runs: ${runs.length}`);

  let totalAnchored = 0, totalUpdated = 0, totalMethodsOnly = 0, totalPlanned = 0;
  let totalMethods = 0, totalErrors = 0, totalElapsed = 0;

  console.log("");
  console.log("Recent runs:");
  console.log("");

  const recentRuns = runs.slice(-10).reverse();
  for (const run of recentRuns) {
    const s = summarizeRun(run);
    totalAnchored += s.anchored;
    totalUpdated += s.updated;
    totalMethodsOnly += s.methods_only;
    totalPlanned += s.planned;
    totalMethods += s.methods;
    totalErrors += s.errors;
    totalElapsed += s.elapsed_sec;

    const dt = new Date(run.ts).toLocaleString();
    const statusEmoji = s.errors === 0 ? "✓" : "⚠";
    console.log(`${statusEmoji} ${dt}`);
    console.log(`   run: ${s.run_id.substring(0, 8)}`);
    console.log(`   target: ${s.target}  layer: ${s.layer}  agents: ${s.agents}x${s.files_per_packet}/packet`);
    console.log(`   anchored: ${s.anchored}  updated: ${s.updated}  methods-only: ${s.methods_only}  planned: ${s.planned}`);
    if (s.methods > 0) console.log(`   methods written: ${s.methods}`);
    if (s.errors > 0) console.log(`   ⚠ errors: ${s.errors}`);
    console.log(`   elapsed: ${s.elapsed_sec}s`);
    console.log("");
  }

  console.log("Aggregates (last 10 runs):");
  console.log(`  files anchored:        ${totalAnchored}`);
  console.log(`  files updated:         ${totalUpdated}`);
  console.log(`  files methods-only:    ${totalMethodsOnly}`);
  console.log(`  files planned:         ${totalPlanned}`);
  console.log(`  total touched:         ${totalAnchored + totalUpdated + totalMethodsOnly + totalPlanned}`);
  console.log(`  methods written:       ${totalMethods}`);
  console.log(`  total errors:          ${totalErrors}`);
  console.log(`  total elapsed:         ${totalElapsed}s`);
}

// warehouse:method
// responsibility: Displays detailed output for a single run including packet breakdown and success metrics
// actor: run_reporter
// role: display_engine
// source_truth: implementation
function renderRun(runId, packets, json) {
  if (!packets) {
    console.error(`Run not found: ${runId}`);
    process.exit(1);
  }

  if (json) {
    console.log(JSON.stringify({ run_id: runId, packets }, null, 2));
    return;
  }

  console.log(`Worker-bee run: ${runId}`);
  console.log(`  packets processed: ${packets.length}`);

  let totalFiles = 0, totalOk = 0, totalErrors = 0, totalMethods = 0;
  for (const pkt of packets) {
    const results = pkt.results || [];
    for (const r of results) {
      totalFiles += 1;
      if (r.status === "error") totalErrors += 1;
      else totalOk += 1;
      totalMethods += r.methodsWritten || r.methodPlanned || 0;
    }
  }

  console.log(`  files processed: ${totalFiles}`);
  console.log(`  successful: ${totalOk}`);
  console.log(`  errors: ${totalErrors}`);
  console.log(`  methods written: ${totalMethods}`);
  console.log("");
  console.log("Packets:");
  for (const pkt of packets) {
    const results = pkt.results || [];
    const ok = results.filter(r => r.status !== "error").length;
    const bad = results.filter(r => r.status === "error").length;
    const meth = results.reduce((n, r) => n + (r.methodsWritten || r.methodPlanned || 0), 0);
    console.log(`  packet ${pkt.pass || 1}-${pkt.packetIndex + 1}: ${results.length} files, ${ok} ok, ${bad} errors` + (meth ? `, ${meth} methods` : ""));
  }
}

// warehouse:method
// responsibility: Routes command flow between summary/detailed run reporting and handles output options
// actor: command_dispatcher
// role: orchestrator
// source_truth: implementation
function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(reportsDir)) {
    console.log("No reports directory yet. Run a worker-bee command first.");
    return 0;
  }

  if (args.summary) {
    const runs = readRuns();

    // Markdown output to file
    if (args.output) {
      const markdown = renderMarkdown(runs);
      const outPath = path.resolve(args.output);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, markdown, "utf8");
      console.log(`Written: ${outPath}`);
      return 0;
    }

    // Console output (json or text)
    renderSummary(runs, args.json);
  } else {
    const packets = readRunDetails(args.runId);
    renderRun(args.runId, packets, args.json);
  }

  return 0;
}

process.exit(main());
