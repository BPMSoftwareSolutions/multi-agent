// warehouse:file
// responsibility: Reads latest run's live status by following pointer and combining packet parts with aggregated metrics
// actor: worker_bee_infrastructure
// role: data_access
// source_truth: implementation

const fs = require("fs");
const path = require("path");
const { combineRun } = require("./run-combiner");

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

module.exports = { readLatestStatus };
