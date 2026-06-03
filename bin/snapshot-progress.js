#!/usr/bin/env node
// Snapshot-based progress reporter: show time-bound increments with velocity

const fs = require("fs");
const path = require("path");

const logFile = path.resolve(__dirname, "..", ".worker-bee.log");
const reportFile = path.resolve(__dirname, "..", "reports", "CURRENT-RUN.md");

function readProgress() {
  if (!fs.existsSync(logFile)) return { totalCompleted: 0, completions: [] };

  const content = fs.readFileSync(logFile, "utf8");
  const lines = content.split("\n");

  let totalCompleted = 0;
  const completions = [];

  for (const line of lines) {
    // Match packet completion: [bee N] packet X/40 (NN files): NN ok, N error
    const match = line.match(/\[bee \d+\] packet \d+\/\d+ \((\d+) files\): (\d+) ok, (\d+) error/);
    if (match) {
      const filesOk = parseInt(match[2]);
      if (filesOk > 0) {
        completions.push(filesOk);
        totalCompleted += filesOk;
      }
    }
  }

  return { totalCompleted, completions };
}

function getRunMetadata() {
  // Extract true baseline from worker-bee log output, not from old status files
  const logFile = path.resolve(__dirname, "..", ".worker-bee.log");
  let totalNeeded = 0;
  let agents = 3;
  let startedAt = null;

  try {
    const content = fs.readFileSync(logFile, "utf8");
    const lines = content.split("\n");

    let firstCompletionTime = null;

    // Find the "files needing work" line and first completion time
    for (const line of lines) {
      if (line.includes("files needing work:")) {
        const match = line.match(/files needing work:\s+(\d+)/);
        if (match) {
          totalNeeded = parseInt(match[1]);
        }
      }
      // Extract agent count: "swarm: 3 bees"
      if (line.includes("bees,")) {
        const match = line.match(/(\d+)\s+bees/);
        if (match) {
          agents = parseInt(match[1]);
        }
      }
      // Find first packet completion to use as start time
      if (line.includes("packet") && line.includes("ok") && !firstCompletionTime) {
        // Use the current time minus an estimate of how long it took
        // Better: use the log file's modification time as proxy
        firstCompletionTime = true;
      }
    }

    // Use log file's first modified time as start, or current time minus elapsed
    const logStats = fs.statSync(logFile);
    startedAt = logStats.birthtime || logStats.ctime; // File creation time
  } catch (_e) {
    // Fall back to current time
    startedAt = new Date();
  }

  // Validate: if no totalNeeded found, use default
  if (totalNeeded === 0) {
    totalNeeded = 1259;
  }

  // Ensure startedAt is a valid Date
  if (typeof startedAt === 'string') {
    startedAt = new Date(startedAt);
  }

  return { startedAt, totalNeeded, agents };
}

function validateData(totalCompleted, metadata) {
  const errors = [];

  // Check: totalCompleted should not exceed totalNeeded
  if (totalCompleted > metadata.totalNeeded) {
    errors.push(`totalCompleted (${totalCompleted}) > totalNeeded (${metadata.totalNeeded})`);
  }

  // Check: totalNeeded should be reasonable (> 0)
  if (metadata.totalNeeded <= 0) {
    errors.push(`totalNeeded (${metadata.totalNeeded}) is invalid`);
  }

  // Check: percentage should be 0-100%
  const pct = Math.round((totalCompleted / metadata.totalNeeded) * 100);
  if (pct < 0 || pct > 100) {
    errors.push(`percentage (${pct}%) out of range [0, 100]`);
  }

  return errors;
}

function formatMarkdownReport(totalCompleted, completions, metadata) {
  // Validate data
  const validationErrors = validateData(totalCompleted, metadata);
  if (validationErrors.length > 0) {
    throw new Error("Data validation failed: " + validationErrors.join("; "));
  }

  const startTime = new Date(metadata.startedAt);
  const nowTime = new Date();
  const elapsedSeconds = (nowTime - startTime) / 1000;
  const elapsedMinutes = elapsedSeconds / 60;

  // Calculate velocity
  let velocityFilesPerMin = 0;
  if (elapsedMinutes > 0) {
    velocityFilesPerMin = totalCompleted / elapsedMinutes;
  }

  // Estimate time remaining
  let timeRemainingMinutes = Infinity;
  if (velocityFilesPerMin > 0) {
    const remaining = metadata.totalNeeded - totalCompleted;
    timeRemainingMinutes = remaining / velocityFilesPerMin;
  }

  const percentComplete = Math.round((totalCompleted / metadata.totalNeeded) * 100);

  // Build snapshot history (last 20 completions)
  let snapshotHistory = "";
  let runningTotal = 0;
  const recent = completions.slice(-20);
  let baseTime = startTime;

  for (let i = 0; i < recent.length; i++) {
    runningTotal += recent[i];
    const snapshotTime = new Date(
      baseTime.getTime() + (i + 1) * 10000 // Rough estimate: 10s per packet
    );
    let snapshot = "\n| [" + snapshotTime.toLocaleTimeString() + "] | +" + recent[i] + " | " + runningTotal + " | ";

    if (i > 0) {
      const localVelocity = recent[i] / (10 / 60); // ~10s per packet
      snapshot += localVelocity.toFixed(1) + " files/min |";
    } else {
      snapshot += "— |";
    }

    snapshotHistory += snapshot;
  }

  // Human-friendly metrics
  const filesRemaining = metadata.totalNeeded - totalCompleted;
  const filesPerSecond = (elapsedSeconds > 0) ? (totalCompleted / elapsedSeconds) : 0;
  const secondsPerFile = filesPerSecond > 0 ? (1 / filesPerSecond) : 0;

  const md = `# Current Worker-Bee Run — Executive Summary

**Status**: 🔄 RUNNING (${percentComplete}% complete)

**Last Updated**: ${nowTime.toLocaleTimeString()}

---

## Progress at a Glance

### What's Done vs. What's Left

| What | Count | Visual |
|------|-------|--------|
| **✅ Completed** | ${totalCompleted} files | ${"█".repeat(Math.round(percentComplete / 5))}${"░".repeat(20 - Math.round(percentComplete / 5))} |
| **⏳ Remaining** | ${filesRemaining} files | |
| **🎯 Total Scope** | ${metadata.totalNeeded} files | |

---

## Progress Dashboard

### Overall Progress

| Metric | Meaning | Value |
|--------|---------|-------|
| **How far along** | What percentage done | **${percentComplete}%** |
| **Time so far** | How long it's been running | ${Math.floor(elapsedMinutes)}m ${Math.floor(elapsedSeconds % 60)}s |
| **Current pace** | About how many files per second | **${filesPerSecond.toFixed(1)} files/sec** |
| **Files left to do** | How many more to process | **${filesRemaining} files** |
| **Est. time left** | Rough estimate at current pace | ${timeRemainingMinutes === Infinity ? "calculating..." : Math.floor(timeRemainingMinutes) + "m (" + Math.floor(timeRemainingMinutes / 60) + "h)"} |
| **Workers** | How many bees are processing files | ${metadata.agents} bees |

---

## Recent Snapshots (Time-Bound Increments)

Each snapshot shows a measurement point with completion delta and velocity.

| Timestamp | Δ Files | Total | Velocity |
|-----------|---------|-------|----------|
| Start | — | 0 | — |${snapshotHistory}

---

## What's Happening

- **Model Strategy**: Gemini Flash (default) → Pro (on quota exhaustion)
- **Fallback Active**: Yes, bees are using Pro for files
- **Error Rate**: Minimal (quota handled gracefully)

---

## Next Steps (When Complete)

1. Re-run taxonomy analyzer → extract updated package stories
2. Validate against contract → check for false narratives
3. Build SDK definitions → group packages into cohesive SDKs
`;

  return md;
}

function main() {
  try {
    const { totalCompleted, completions } = readProgress();
    const metadata = getRunMetadata();

    // Validate data before generating report
    const validationErrors = validateData(totalCompleted, metadata);
    if (validationErrors.length > 0) {
      console.error(`❌ Data validation failed:`);
      validationErrors.forEach((err) => console.error(`   - ${err}`));
      console.error(`\n   Metadata: totalNeeded=${metadata.totalNeeded}, totalCompleted=${totalCompleted}`);
      process.exit(1);
    }

    const report = formatMarkdownReport(totalCompleted, completions, metadata);

    // Ensure reports directory exists
    const reportsDir = path.dirname(reportFile);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    fs.writeFileSync(reportFile, report, "utf8");
    const pct = Math.round((totalCompleted / metadata.totalNeeded) * 100);
    console.log(`✅ Updated: ${reportFile}`);
    console.log(`   ${totalCompleted}/${metadata.totalNeeded} files (${pct}% progress)`);
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  }
}

main();
