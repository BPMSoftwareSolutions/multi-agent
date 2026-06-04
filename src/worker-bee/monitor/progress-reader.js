// warehouse:file
// responsibility: Parses worker-bee log for packet completion events and progress metrics
// actor: log_parser
// role: data_extractor
// source_truth: implementation

const fs = require("fs");

// warehouse:method
// responsibility: Parses worker-bee log for packet completion events, extracts file success counts, tracks total work metrics and timestamps for progress monitoring
// actor: log_parser
// role: data_extractor
// source_truth: implementation
function readProgress(logFile) {
  const content = fs.readFileSync(logFile, "utf8");
  const lines = content.split("\n");

  let totalCompleted = 0;
  let lastProgressTime = null;

  for (const line of lines) {
    // Match packet completion: [bee N] packet X/40 (NN files): NN ok, N error
    const match = line.match(/\[bee \d+\] packet \d+\/\d+ \((\d+) files\): (\d+) ok, (\d+) error/);
    if (match) {
      const filesOk = parseInt(match[2]);
      if (filesOk > 0) {
        totalCompleted += filesOk;
      }
    }
  }

  // Get file modification time as proxy for last activity
  const stats = fs.statSync(logFile);
  lastProgressTime = stats.mtime;

  return { totalCompleted, lastProgressTime };
}

module.exports = { readProgress };
