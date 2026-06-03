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
      case "--packet": rt.packetFile = next(); break;
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
  --packet <file.json>      Load a packet that determines the bee workload
  --dry-run                 Classify and show anchors, write nothing
  --json                    Machine-readable output

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

async function main() {
  const { rt, ov } = parseArgs(process.argv.slice(2));
  if (rt.help) {
    process.stdout.write(HELP);
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

  const maxPasses = rt.dryRun ? 1 : Math.max(1, packet.swarm.max_passes);
  const grand = { anchored: 0, updated: 0, methods_only: 0, planned: 0, error: 0, methods: 0 };
  let lastWorkCount = Infinity;
  let totalPython = 0;
  let trustworthy = 0;
  let finalErrors = [];
  const started = Date.now();

  for (let pass = 1; pass <= maxPasses; pass += 1) {
    const scan = findWork(target, repoRoot, {
      mode: packet.mode,
      layer: packet.layer,
      limit: rt.limit > 0 ? rt.limit : undefined,
    });
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
      onProgress: rt.json
        ? null
        : ({ beeId, index, totalPackets, packetFiles, oversize, results }) => {
            const ok = results.filter((r) => r.status !== "error").length;
            const bad = results.filter((r) => r.status === "error").length;
            const meth = results.reduce((n, r) => n + (r.methodsWritten || r.methodPlanned || 0), 0);
            const tag = oversize ? "oversize" : `${packetFiles} files`;
            console.log(`  [bee ${beeId}] packet ${index + 1}/${totalPackets} (${tag}): ${ok} ok, ${bad} error` + (meth ? `, +${meth} methods` : ""));
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

  return grand.error > 0 ? 2 : 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(`worker-bee failed: ${err.message}`);
    process.exit(2);
  });
