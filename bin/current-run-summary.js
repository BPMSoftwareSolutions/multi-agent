#!/usr/bin/env node
// warehouse:file
// responsibility: Generates live executive summary of active worker-bee runs with progress percentage and ETA
// actor: run_reporter
// role: reporter
// source_truth: implementation

// Generate a live executive summary of the current worker-bee run with percentage complete

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// warehouse:method
// responsibility: Fetches the latest worker-bee run status from CLI and parses JSON response
// actor: status_fetcher
// role: data_loader
// source_truth: implementation
function getCurrentStatus() {
  try {
    const output = execSync("node bin/worker-bee.js --status --json", { encoding: "utf8" });
    return JSON.parse(output);
  } catch (e) {
    return null;
  }
}

// warehouse:method
// responsibility: Formats run status object into markdown executive summary with progress metrics and next steps
// actor: summary_formatter
// role: reporter
// source_truth: implementation
function formatSummary(status) {
  if (!status) {
    return `# Current Worker-Bee Run — Executive Summary

**Status**: No active run detected

Check \`reports/RUNS.md\` for historical runs.`;
  }

  const { state, totals, started_at, target, layer, mode, packet } = status;
  const done = totals.done || 0;
  const needsWork = totals.needs_work || 0;
  const remaining = totals.remaining || 0;
  const errors = totals.outstanding_errors || 0;

  const percentComplete = needsWork > 0 ? Math.round((done / needsWork) * 100) : 0;
  const statusEmoji = state === "running" ? "🔄" : state === "completed" ? "✅" : "⏸";

  return `# Current Worker-Bee Run — Executive Summary

**Status**: ${statusEmoji} ${state.toUpperCase()}

---

## Run Overview

| Metric | Value |
|--------|-------|
| **Operation** | File-layer revalidate (fix unclear responsibilities) |
| **Target** | \`${target}\` folder |
| **Layer** | \`${layer}\` |
| **Mode** | \`${mode}\` |
| **Scope** | ${needsWork.toLocaleString()} files with low-quality responsibilities |
| **Agents** | ${packet.agents} Gemini bees |
| **Started** | ${new Date(started_at).toLocaleString()} |

---

## Progress

### **${percentComplete}% COMPLETE** — ${done.toLocaleString()}/${needsWork.toLocaleString()} files revalidated

| Metric | Count |
|--------|-------|
| Files completed | ${done.toLocaleString()} |
| Files remaining | ${remaining.toLocaleString()} |
| Errors | ${errors > 0 ? `⚠ ${errors}` : "✅ None"} |

---

## What We're Doing

Rewriting unclear responsibilities into clear, human-readable prose:
- **Before**: \`"__init__ module"\`, \`"noqa: F401, F403"\`
- **After**: \`"Initializes alignment persistence store exports"\`

**Why**: To extract true package stories and enable accurate SDK grouping

---

## Success Criteria (on completion)

✅ All 1,821 files revalidated (${percentComplete}% — target 100%)
✅ New run entry in \`reports/RUNS.md\` "Recent Runs"
✅ Zero outstanding errors
✅ Coverage increases from 7.0% baseline

---

## Next Steps (When Revalidate Completes)

1. Re-run taxonomy analyzer → extract updated package stories
2. Validate against contract → check for false narratives
3. Build SDK definitions → group packages into cohesive SDKs
`;
}

const summary = formatSummary(getCurrentStatus());
const outputPath = path.resolve(__dirname, "..", "reports", "CURRENT-RUN.md");
fs.writeFileSync(outputPath, summary, "utf8");
console.log(`Updated: ${outputPath}`);
