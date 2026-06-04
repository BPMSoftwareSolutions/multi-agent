#!/usr/bin/env node
// warehouse:file
// responsibility: Continuous progress monitor: parses worker-bee log for packet completions, tracks total work items, formats human-readable time elapsed, watches for stalls and alerts
// actor: progress_tracker
// role: monitor
// source_truth: implementation

// Continuous progress tracker: watch for new completion events and alert on stalls

const fs = require("fs");
const path = require("path");

const logFile = path.resolve(__dirname, "..", ".worker-bee.log");
const STALL_THRESHOLD_SECONDS = 120; // Alert if no progress for 2 minutes

if (!fs.existsSync(logFile)) {
  console.error(`❌ Worker-bee log not found: ${logFile}`);
  process.exit(1);
}

// warehouse:method
// responsibility: Parses log for completion events
// actor: log_parser
// role: data_extractor
// source_truth: implementation
function readProgress() {
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
        // Extract timestamp from line (lines have timestamps if logged with them)
        // For now, we track file count; timestamp is in the line itself
      }
    }
  }

  // Get file modification time as proxy for last activity
  const stats = fs.statSync(logFile);
  lastProgressTime = stats.mtime;

  return { totalCompleted, lastProgressTime };
}

// warehouse:method
// responsibility: Formats duration into human-readable string
// actor: formatter
// role: utility
// source_truth: implementation
function formatTimeDiff(ms) {
  if (ms < 60000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  return `${Math.floor(ms / 3600000)}h ago`;
}

// Watch for changes
let previousCount = 0;
let stallAlertSent = false;

setInterval(() => {
  try {
    const { totalCompleted, lastProgressTime } = readProgress();
    const now = Date.now();
    const timeSinceLastProgress = now - lastProgressTime.getTime();
    const isStalled = timeSinceLastProgress > STALL_THRESHOLD_SECONDS * 1000;

    // Detect progress change
    if (totalCompleted > previousCount) {
      const newFiles = totalCompleted - previousCount;
      console.log(`✅ [${new Date().toLocaleTimeString()}] ${newFiles} new files completed → ${totalCompleted} total`);
      previousCount = totalCompleted;
      stallAlertSent = false;
    }

    // Alert on stall
    if (isStalled && !stallAlertSent) {
      console.warn(`⚠️  [${new Date().toLocaleTimeString()}] STALLED — no progress for ${formatTimeDiff(timeSinceLastProgress)}`);
      stallAlertSent = true;
    }

    // Clear stall alert when progress resumes
    if (!isStalled && stallAlertSent) {
      console.log(`✅ [${new Date().toLocaleTimeString()}] Progress resumed`);
      stallAlertSent = false;
    }
  } catch (err) {
    console.error(`Error reading log: ${err.message}`);
  }
}, 5000); // Check every 5 seconds

console.log(`📊 Tracking progress on ${logFile}`);
console.log(`⏱️  Will alert if no progress for ${STALL_THRESHOLD_SECONDS}s`);
console.log(`\nMonitoring... (Ctrl+C to stop)\n`);
