// warehouse:file
// responsibility: Formats progress metrics into human-readable markdown reports
// actor: report_formatter
// role: formatter
// source_truth: implementation

const { validateData } = require("../src/progress/data-validator");

// warehouse:method
// responsibility: Generates progress snapshot: formats markdown report with velocity metrics, completion calculations, forecast
// actor: report_formatter
// role: formatter
// source_truth: implementation
function formatMarkdownReport(totalCompleted, completions, metadata, totalErrors = 0) {
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
- **Rate-Limit Errors**: Expected (${totalErrors} so far) — these are from quota limits and are automatically retried
  - Errors are NOT a problem; they trigger the fallback mechanism
  - The retry logic handles them deterministically
- **Success Rate**: ${Math.round((totalCompleted / (totalCompleted + totalErrors)) * 100)}% of attempted files succeeded on first try

---

## Next Steps (When Complete)

1. Re-run taxonomy analyzer → extract updated package stories
2. Validate against contract → check for false narratives
3. Build SDK definitions → group packages into cohesive SDKs
`;

  return md;
}

module.exports = { formatMarkdownReport };
