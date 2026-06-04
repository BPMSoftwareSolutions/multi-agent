// warehouse:file
// responsibility: Provides combineRun, finalizeRun, readLatestStatus functionality
// actor: worker_bee_infrastructure
// role: data_access
// source_truth: implementation

const fs = require("fs");
const path = require("path");

// warehouse:method
// responsibility: Merges manifest and packet parts into read-only live status view with aggregated metrics and completion tracking
// actor: method_implementation
// role: implementation
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
// responsibility: Finalizes run by marking manifest done, combining packet parts status, and writing aggregated completion snapshot
// actor: method_implementation
// role: implementation
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
// responsibility: Reads latest run's live status by following pointer and combining packet parts with aggregated metrics
// actor: method_implementation
// role: implementation
// source_truth: implementation
function readLatestStatus(reportsDir) {
  const pointerPath = path.join(reportsDir, "latest-run.json");
  if (!fs.existsSync(pointerPath)) return null;
  const { dir } = JSON.parse(fs.readFileSync(pointerPath, "utf8"));
  if (!dir || !fs.existsSync(dir)) return null;
  return combineRun(dir);
}

module.exports = { combineRun, finalizeRun, readLatestStatus };
