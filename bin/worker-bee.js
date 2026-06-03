#!/usr/bin/env node
// Worker-bee CLI: fan out taxonomy-anchor work to a swarm of Gemini bees.
//
// Thin, isolated process. It scans a target repo for Python files whose taxonomy
// anchors are missing or low-quality, hands PACKETS of files to bees, and writes
// trustworthy anchors back. The python taxonomy_comment_scanner remains the gate.
//
// The bee's workload is NOT hardcoded — it is determined by a PACKET
// (src/worker-bee/packet.js). Defaults <- --packet file <- CLI flag overrides.

const path = require("path");
const fs = require("fs");

// Load env from .env.local then .env (local wins), like the rest of the studio.
const root = path.resolve(__dirname, "..");
for (const name of [".env.local", ".env"]) {
  const p = path.join(root, name);
  if (fs.existsSync(p)) require("dotenv").config({ path: p });
}

const { findWork } = require("../src/worker-bee/scan");
const { runFileSwarm } = require("../src/worker-bee/run-file-swarm");
const { buildPacket, describePacket } = require("../src/worker-bee/packet");
const { newRunId, initRun, writePart, finalizeRun, readLatestStatus } = require("../src/worker-bee/ledger");

const DEFAULT_REPO_ROOT =
  process.env.WORKER_BEE_REPO_ROOT || "C:/source/repos/bpm/internal/ai-engine";

// Parse argv into runtime settings + a sparse packet-override object. Only flags
// the user actually passes become overrides; everything else stays at packet/default.
function parseArgs(argv) {
  const rt = { repoRoot: DEFAULT_REPO_ROOT, target: null, limit: 0, dryRun: false, json: false, packetFile: null, help: false };
  const ov = { swarm: {}, workload: {} };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      // runtime / location
      case "--repo-root": rt.repoRoot = next(); break;
      case "--target": rt.target = next(); break;
      case "--limit": rt.limit = parseInt(next(), 10); break;
      case "--dry-run": rt.dryRun = true; break;
      case "--json": rt.json = true; break;
      case "--status": rt.statusOnly = true; break;
      case "--packet": rt.packetFile = next(); break;
      case "--from": rt.fromFile = next(); break;
      // packet overrides
      case "--layer": ov.layer = next(); break;
      case "--mode": ov.mode = next(); break;
      case "--model": ov.model = next(); break;
      case "--agents": ov.swarm.agents = parseInt(next(), 10); break;
      case "--max-passes": ov.swarm.max_passes = parseInt(next(), 10); break;
      case "--files-per-packet": ov.workload.max_files_per_packet = parseInt(next(), 10); break;
      case "--anchor-budget": ov.workload.anchor_budget = parseInt(next(), 10); break;
      case "--method-batch": ov.workload.method_batch = parseInt(next(), 10); break;
      case "--max-output-tokens": ov.workload.max_output_tokens = parseInt(next(), 10); break;
      case "-h":
      case "--help": rt.help = true; break;
      default:
        console.error(`Unknown argument: ${a}`);
        process.exit(1);
    }
  }
  return { rt, ov };
}

const HELP = `Worker-bee: taxonomy-anchor swarm (Gemini)

The bee's workload is set by a PACKET (defaults <- --packet file <- flags).

Location / runtime:
  --repo-root <path>        Repo root for expected_location (default: ${DEFAULT_REPO_ROOT})
  --target <path>           Subtree to scan (default: same as repo-root)
  --limit <n>               Cap files this run (pilot mode)
  --from <tracking.json>    Drive the bee from a taxonomy-scan file (no re-scan)
  --packet <file.json>      Load a packet that determines the bee workload
  --dry-run                 Classify and show anchors, write nothing
  --json                    Machine-readable output
  --status                  Print the live status ledger (reports/status-latest.json) and exit

Packet overrides:
  --layer <file|method|both>        Which anchor layer(s)
  --mode <all|missing|revalidate>   What to process
  --model <name>                    Gemini model
  --agents <n>                      How many bees fly at once
  --max-passes <n>                  Self-heal: re-run until clean, up to n passes
  --files-per-packet <n>            Max files packed into one bee request
  --anchor-budget <n>               Max anchors (the "weight") per bee request
  --method-batch <n>                Methods per call for an oversize file
  --max-output-tokens <n>           Model output cap per request
`;

function renderStatus(status, json) {
  if (!status) {
    console.log("No status ledger yet (reports/status-latest.json not found). Start a run first.");
    return;
  }
  if (json) {
    console.log(JSON.stringify(status, null, 2));
    return;
  }
  const t = status.totals;
  const pct = t.needs_work ? Math.round((t.done / t.needs_work) * 100) : 100;
  console.log(`Worker-bee status [${status.state}]  run ${status.run_id}`);
  console.log(`  target: ${status.target}   layer: ${status.layer}   ${status.packet.agents} bees x ${status.packet.files_per_packet}/packet`);
  console.log(`  started: ${status.started_at}   updated: ${status.updated_at}`);
  console.log(`  progress: ${t.done}/${t.needs_work} done (${pct}%)  remaining: ${t.remaining}  errors: ${t.outstanding_errors}  methods: ${t.methods_written}`);
  console.log(`  packets completed: ${status.packets.completed}   pass: ${status.pass}`);
  if (status.errors && status.errors.length) {
    console.log("  outstanding errors:");
    for (const e of status.errors.slice(0, 8)) console.log(`    - ${e.path}: ${e.reason}`);
  }
}

async function main() {
  const { rt, ov } = parseArgs(process.argv.slice(2));
  if (rt.help) {
    process.stdout.write(HELP);
    return 0;
  }
  if (rt.statusOnly) {
    renderStatus(readLatestStatus(path.join(root, "reports")), rt.json);
    return 0;
  }

  const repoRoot = path.resolve(rt.repoRoot);
  const target = path.resolve(rt.target || rt.repoRoot);
  if (!fs.existsSync(target)) {
    console.error(`Target does not exist: ${target}`);
    return 1;
  }

  let packet;
  try {
    packet = buildPacket({ file: rt.packetFile, overrides: ov });
  } catch (error) {
    console.error(`Could not load packet: ${error.message}`);
    return 1;
  }

  if (!["file", "method", "both"].includes(packet.layer)) {
    console.error(`Invalid layer: ${packet.layer} (use file|method|both)`);
    return 1;
  }

  // When driven by a scan file, the bee does one pass over exactly what the scan
  // marked untouched — it does not re-scan or re-derive work.
  const maxPasses = rt.dryRun || rt.fromFile ? 1 : Math.max(1, packet.swarm.max_passes);
  const grand = { anchored: 0, updated: 0, methods_only: 0, planned: 0, error: 0, methods: 0 };
  let lastWorkCount = Infinity;
  let totalPython = 0;
  let trustworthy = 0;
  let finalErrors = [];
  const started = Date.now();

  // Live status ledger: written after every packet so a background run is
  // observable while in flight. Read it with: node bin/worker-bee.js --status
  const reportsDir = path.join(root, "reports");
  const runId = newRunId();
  const trackable = !rt.dryRun;
  let runDir = null;
  const relTarget = path.relative(repoRoot, target).split(path.sep).join("/") || ".";

  for (let pass = 1; pass <= maxPasses; pass += 1) {
    let scan;
    if (rt.fromFile) {
      const tracking = JSON.parse(fs.readFileSync(path.resolve(rt.fromFile), "utf8"));
      scan = {
        totalPython: tracking.summary ? tracking.summary.total_python : (tracking.work || []).length,
        trustworthy: tracking.summary ? tracking.summary.touched_files : 0,
        work: tracking.work || [],
      };
    } else {
      scan = findWork(target, repoRoot, {
        mode: packet.mode,
        layer: packet.layer,
        limit: rt.limit > 0 ? rt.limit : undefined,
      });
    }
    totalPython = scan.totalPython;
    trustworthy = scan.trustworthy;
    const work = scan.work;

    if (pass === 1 && !rt.json) {
      const filesNeedingFile = work.filter((w) => w.doFile).length;
      const filesNeedingMethods = work.filter((w) => w.doMethods).length;
      const methodsNeeding = work.reduce((n, w) => n + w.methodsNeeding.length, 0);
      console.log(`Worker-bee taxonomy swarm`);
      console.log(`  repo-root: ${repoRoot}`);
      console.log(`  target:    ${target}`);
      console.log(`  packet (${rt.packetFile || "defaults"}):`);
      console.log(describePacket(packet));
      console.log(`  max-passes: ${maxPasses}` + (rt.dryRun ? "  [dry-run]" : ""));
      console.log(`  python files in target: ${totalPython}`);
      console.log(`  fully trustworthy:      ${trustworthy}`);
      console.log(`  files needing work:     ${work.length}` + (rt.limit ? ` (capped at ${rt.limit})` : ""));
      if (packet.layer !== "method") console.log(`    - file anchors:   ${filesNeedingFile}`);
      if (packet.layer !== "file") console.log(`    - method anchors: ${methodsNeeding} across ${filesNeedingMethods} files`);
      console.log("");
    }

    if (pass === 1 && trackable) {
      runDir = initRun(reportsDir, { runId, target: relTarget, layer: packet.layer, mode: packet.mode, packet, totalPython, needsWork: work.length });
    }

    if (work.length === 0) {
      if (pass === 1 && !rt.json) console.log("Nothing to do — every Python file in target is trustworthy for this layer.");
      break;
    }

    // Stop if a retry pass made no progress (persistent, non-transient errors).
    if (pass > 1 && work.length >= lastWorkCount) {
      if (!rt.json) console.log(`  pass ${pass}: no progress (${work.length} still failing) — stopping retries.`);
      finalErrors = work.map((w) => ({ path: w.path }));
      break;
    }
    lastWorkCount = work.length;

    if (!rt.json && maxPasses > 1) console.log(`--- pass ${pass}/${maxPasses}: ${work.length} files ---`);

    const { tally, methodsTotal, results } = await runFileSwarm(work, {
      packet,
      apiKey: process.env.GEMINI_API_KEY,
      dryRun: rt.dryRun,
      onProgress: ({ beeId, index, totalPackets, packetFiles, oversize, results }) => {
        // Each bee writes its OWN packet file — no shared-file write contention.
        if (trackable && runDir) {
          writePart(runDir, { pass, packetIndex: index, oversize, results });
        }
        if (!rt.json) {
          const ok = results.filter((r) => r.status !== "error").length;
          const bad = results.filter((r) => r.status === "error").length;
          const meth = results.reduce((n, r) => n + (r.methodsWritten || r.methodPlanned || 0), 0);
          const tag = oversize ? "oversize" : `${packetFiles} files`;
          console.log(`  [bee ${beeId}] packet ${index + 1}/${totalPackets} (${tag}): ${ok} ok, ${bad} error` + (meth ? `, +${meth} methods` : ""));
        }
      },
    });

    grand.anchored += tally.anchored;
    grand.updated += tally.updated;
    grand.methods_only += tally.methods_only;
    grand.planned += tally.planned;
    grand.error = tally.error; // current outstanding errors
    grand.methods += methodsTotal;
    finalErrors = results.filter((r) => r.status === "error");

    if (rt.dryRun || tally.error === 0) break;
  }

  const elapsed = ((Date.now() - started) / 1000).toFixed(1);

  if (trackable && runDir) {
    finalizeRun(reportsDir, runDir);
  }

  if (rt.json) {
    console.log(JSON.stringify({ totalPython, trustworthy, packet, tally: grand, errors: finalErrors.map((e) => ({ path: e.path, reason: e.reason })), elapsedSeconds: Number(elapsed) }, null, 2));
  } else {
    console.log("");
    console.log(`Done in ${elapsed}s.`);
    console.log(`  anchored: ${grand.anchored}  updated: ${grand.updated}  methods-only: ${grand.methods_only}  planned: ${grand.planned}  outstanding errors: ${grand.error}`);
    console.log(`  method anchors written/planned: ${grand.methods}`);
    if (finalErrors.length) {
      console.log("  files still failing:");
      for (const e of finalErrors.slice(0, 10)) console.log(`    - ${e.path}${e.reason ? `: ${e.reason}` : ""}`);
    }
    console.log("");
    console.log("Validate with the authoritative scanner:");
    const tax = packet.layer === "file" ? "TAX-ANCHOR-1" : "TAX-ANCHOR-2";
    console.log(`  python packages/warehouse-intelligence-scripts-executor/scripts/taxonomy_comment_scanner.py --packet ${tax}`);
  }

  // Append a run record (audit trail of bee runs) unless this was a dry run.
  if (!rt.dryRun) {
    try {
      const runsPath = path.join(root, "reports", "runs.jsonl");
      fs.mkdirSync(path.dirname(runsPath), { recursive: true });
      const record = {
        ts: new Date().toISOString(),
        target: path.relative(repoRoot, target).split(path.sep).join("/") || ".",
        layer: packet.layer,
        mode: packet.mode,
        agents: packet.swarm.agents,
        files_per_packet: packet.workload.max_files_per_packet,
        anchor_budget: packet.workload.anchor_budget,
        totalPython,
        tally: grand,
        outstanding_errors: finalErrors.length,
        elapsed_seconds: Number(elapsed),
      };
      fs.appendFileSync(runsPath, JSON.stringify(record) + "\n", "utf8");
    } catch (_e) {
      /* run logging is best-effort */
    }
  }

  return grand.error > 0 ? 2 : 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(`worker-bee failed: ${err.message}`);
    process.exit(2);
  });
