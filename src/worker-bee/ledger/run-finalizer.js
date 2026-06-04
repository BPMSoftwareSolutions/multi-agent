// warehouse:file
// responsibility: Finalizes run by marking manifest done, combining packet parts status, and writing aggregated completion snapshot
// actor: worker_bee_infrastructure
// role: data_access
// source_truth: implementation

const fs = require("fs");
const path = require("path");
const { combineRun } = require("./run-combiner");

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

module.exports = { finalizeRun };
