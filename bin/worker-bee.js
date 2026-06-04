// warehouse:file
// responsibility: Orchestrates renderStatus, main and related operations
// actor: worker_bee_swarm
// role: orchestrator
// source_truth: implementation

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
const { parseArgs, HELP } = require("./argument-parser");
const { renderStatus } = require("./status-renderer");
const { main: runOrchestration } = require("./main-orchestrator");

// Load env from .env.local then .env (local wins), like the rest of the studio.
const root = path.resolve(__dirname, "..");
for (const name of [".env.local", ".env"]) {
  const p = path.join(root, name);
  if (fs.existsSync(p)) require("dotenv").config({ path: p });
}

// Load config from .worker-bee.json
let config = {};
const configPath = path.join(root, ".worker-bee.json");
if (fs.existsSync(configPath)) {
  config = JSON.parse(fs.readFileSync(configPath, "utf8"));
}

const { buildPacket } = require("../src/worker-bee/packet");
const { readLatestStatus } = require("../src/worker-bee/ledger");
const { cleanupLedgers } = require("../scripts/cleanup-ledgers");

const DEFAULT_REPO_ROOT = process.env.WORKER_BEE_REPO_ROOT || config.repoRoot;
if (!DEFAULT_REPO_ROOT) {
  console.error('❌ Missing repo root configuration. Set WORKER_BEE_REPO_ROOT env var or .worker-bee.json repoRoot');
  process.exit(1);
}

// warehouse:method
// responsibility: Orchestrates complete swarm execution workflow: scanning for work, distributing packets to bees, tracking progress via ledger, managing retries until convergence, and reporting results
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function main() {
  // Clean up old ledgers before starting any new work
  cleanupLedgers();

  const { rt, ov } = parseArgs(process.argv.slice(2), config, DEFAULT_REPO_ROOT);
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

  return runOrchestration(root, repoRoot, target, packet, rt, rt.dryRun, rt.json, rt.packetFile);
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(`worker-bee failed: ${err.message}`);
    process.exit(2);
  });
