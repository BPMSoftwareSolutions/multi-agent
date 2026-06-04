#!/usr/bin/env node
// warehouse:file
// responsibility: Monitors worker-bee progress by polling log file, detecting completion changes and alerting on stalls
// actor: progress_tracker
// role: monitor
// source_truth: implementation

// Continuous progress tracker: watch for new completion events and alert on stalls

const fs = require("fs");
const path = require("path");
const { readProgress } = require("../src/worker-bee/monitor/progress-reader");
const { formatTimeDiff } = require("../src/worker-bee/monitor/time-formatter");

const logFile = path.resolve(__dirname, "..", ".worker-bee.log");
const STALL_THRESHOLD_SECONDS = 120; // Alert if no progress for 2 minutes

if (!fs.existsSync(logFile)) {
  console.error(`❌ Worker-bee log not found: ${logFile}`);
  process.exit(1);
}

// Watch for changes
let previousCount = 0;
let stallAlertSent = false;

setInterval(() => {
  try {
    const { totalCompleted, lastProgressTime } = readProgress(logFile);
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
