// warehouse:file
// responsibility: Initializes new runs and manages run directory structure for tracking
// actor: worker_bee_infrastructure
// role: ledger_manager
// source_truth: implementation

const fs = require("fs");
const path = require("path");

// warehouse:method
// responsibility: Initializes new runs: generates unique run ID from timestamp with URL-safe formatting
// actor: method_implementation
// role: implementation
// source_truth: implementation
function newRunId() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

// warehouse:method
// responsibility: undefined
// actor: undefined
// role: undefined
// source_truth: implementation

function runsDir(reportsDir) {
  return path.join(reportsDir, "runs");
}

// warehouse:method
// responsibility: undefined
// actor: undefined
// role: undefined
// source_truth: implementation

function initRun(reportsDir, { runId, target, layer, mode, packet, totalPython, needsWork }) {
  const dir = path.join(runsDir(reportsDir), runId);
  fs.mkdirSync(dir, { recursive: true });
  const manifest = {
    schema: "worker-bee-run.v1",
    run_id: runId,
    state: "running",
    target,
    layer,
    mode,
    packet: {
      agents: packet.swarm.agents,
      files_per_packet: packet.workload.max_files_per_packet,
      anchor_budget: packet.workload.anchor_budget,
      model: packet.model,
    },
    total_python: totalPython,
    needs_work: needsWork,
    started_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
  // Single-write pointer to the latest run (no contention — written once).
  fs.writeFileSync(path.join(reportsDir, "latest-run.json"), JSON.stringify({ run_id: runId, dir }, null, 2), "utf8");
  return dir;
}

module.exports = { newRunId, runsDir, initRun };
