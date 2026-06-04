// warehouse:file
// responsibility: Run ledger: generates unique run IDs, manages run directories, initializes runs, logs packet completions, parses and aggregates live status from manifest and immutable part files
// actor: worker_bee_infrastructure
// role: data_access
// source_truth: implementation

// Live status ledger WITHOUT shared-file write contention.
//
// Design: each completed packet writes its OWN immutable part file
//   reports/runs/<run_id>/packet-p<pass>-<index>.json
// The run manifest is written once at start. The orchestrator/monitor COMBINES
// the manifest + all part files on read to produce the live status. No two writers
// ever touch the same file, so bees (even as separate processes later) never
// contend on I/O. The single status-latest.json is only written once, at the end,
// by the orchestrator as the combined artifact.

const fs = require("fs");
const path = require("path");

// warehouse:method
// responsibility: Generates a unique run ID from current timestamp with URL-safe formatting
// actor: worker_bee_infrastructure
// role: infrastructure
// source_truth: implementation
function newRunId() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

// warehouse:method
// responsibility: Constructs the runs directory path under the reports root
// actor: worker_bee_infrastructure
// role: infrastructure
// source_truth: implementation
function runsDir(reportsDir) {
  return path.join(reportsDir, "runs");
}

// warehouse:method
// responsibility: Initializes a new run by creating directory, writing manifest, and updating latest-run pointer
// actor: worker_bee_infrastructure
// role: data_access
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

// warehouse:method
// responsibility: Writes a packet result file with unique name to prevent write contention
// actor: worker_bee_infrastructure
// role: data_access
// source_truth: implementation
function writePart(runDir, { pass, packetIndex, oversize, results }) {
  const name = `packet-p${pass || 1}-${String(packetIndex).padStart(4, "0")}.json`;
  const part = { pass: pass || 1, packet_index: packetIndex, oversize: !!oversize, ts: new Date().toISOString(), results };
  fs.writeFileSync(path.join(runDir, name), JSON.stringify(part), "utf8");
}

// warehouse:method
// responsibility: Merges manifest and all part files into a read-only live status view with aggregated metrics
// actor: worker_bee_infrastructure
// role: data_access
// source_truth: implementation
function combineRun(runDir) {
  const manifestPath = path.join(runDir, "manifest.json");
  if (!fs.existsSync(manifestPath)) return null;
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  const parts = fs
    .readdirSync(runDir)
    .filter((f) => f.startsWith("packet-") && f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(runDir, f), "utf8")))
    .sort((a, b) => a.ts.localeCompare(b.ts));

  const donePaths = new Set();
  const errorPaths = {};
  let methods = 0;
  let pass = 0;
  const recent = [];
  for (const part of parts) {
    pass = Math.max(pass, part.pass || 1);
    for (const r of part.results) {
      if (r.status === "error") {
        errorPaths[r.path] = r.reason || "error";
      } else {
        donePaths.add(r.path);
        delete errorPaths[r.path];
        methods += r.methodsWritten || 0;
      }
      recent.unshift({ path: r.path, status: r.status, reason: r.reason });
    }
  }

  return {
    schema: "worker-bee-status.v1",
    run_id: manifest.run_id,
    state: manifest.state,
    completion_status: manifest.completion_status,
    target: manifest.target,
    layer: manifest.layer,
    mode: manifest.mode,
    packet: manifest.packet,
    started_at: manifest.started_at,
    updated_at: manifest.updated_at,
    totals: {
      total_python: manifest.total_python,
      needs_work: manifest.needs_work,
      done: donePaths.size,
      outstanding_errors: Object.keys(errorPaths).length,
      remaining: Math.max(manifest.needs_work - donePaths.size, 0),
      methods_written: methods,
    },
    packets: { completed: parts.length },
    pass,
    recent: recent.slice(0, 20),
    errors: Object.entries(errorPaths).slice(0, 50).map(([p, reason]) => ({ path: p, reason })),
  };
}

// warehouse:method
// responsibility: Finalizes run by marking manifest done, combining status, and writing completion snapshot
// actor: worker_bee_infrastructure
// role: data_access
// source_truth: implementation
function finalizeRun(reportsDir, runDir, { completionStatus } = {}) {
  const manifestPath = path.join(runDir, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  manifest.state = "done";
  manifest.updated_at = new Date().toISOString();
  const status = combineRun(runDir);
  manifest.completion_status =
    completionStatus || (status.totals.outstanding_errors === 0 && status.totals.remaining === 0 ? "complete" : "incomplete");
  status.state = "done";
  status.completion_status = manifest.completion_status;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  fs.writeFileSync(path.join(runDir, "status.json"), JSON.stringify(status, null, 2), "utf8");
  fs.writeFileSync(path.join(reportsDir, "status-latest.json"), JSON.stringify(status, null, 2), "utf8");
  return status;
}

// warehouse:method
// responsibility: Reads latest run's live status by following pointer and combining parts
// actor: worker_bee_infrastructure
// role: data_access
// source_truth: implementation
function readLatestStatus(reportsDir) {
  const pointerPath = path.join(reportsDir, "latest-run.json");
  if (!fs.existsSync(pointerPath)) return null;
  const { dir } = JSON.parse(fs.readFileSync(pointerPath, "utf8"));
  if (!dir || !fs.existsSync(dir)) return null;
  return combineRun(dir);
}

module.exports = { newRunId, initRun, writePart, combineRun, finalizeRun, readLatestStatus };
