#!/usr/bin/env node
// warehouse:file
// responsibility: Generates the current codebase story review report from latest taxonomy scan and swarm evidence without preserving legacy story narratives
// actor: codebase_story_review_cli
// role: report_command
// source_truth: implementation

const fs = require("fs");
const path = require("path");
const {
  buildReport,
  writeCodebaseStoryReviewReport,
} = require("../src/observability/codebase-story-review-report");

// warehouse:method
// responsibility: Generates the current codebase story review report from latest taxonomy scan and swarm evidence without preserving legacy story narratives
// actor: method_implementation
// role: implementation
// source_truth: implementation
function loadJson(filePath, required = true) {
  if (!fs.existsSync(filePath)) {
    if (required) {
      throw new Error(`Missing required report artifact: ${filePath}`);
    }
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

// warehouse:method
// responsibility: Generates the current codebase story review report from latest taxonomy scan and swarm evidence without preserving legacy story narratives
// actor: method_implementation
// role: implementation
// source_truth: implementation
function runCodebaseStoryReviewReport() {
  const root = path.resolve(__dirname, "..");
  const reportsDir = path.join(root, "reports");
  const scan = loadJson(path.join(reportsDir, "scan-report-latest.json"));
  const swarm = loadJson(path.join(reportsDir, "swarm-report-latest.json"), false);
  const report = buildReport(scan, swarm);
  const artifacts = writeCodebaseStoryReviewReport(report, reportsDir);
  const economyScoreLabel = report.file_economy.status === "pass" ? "earned" : "provisional";
  console.log(`Codebase story review written: ${artifacts.latest_markdown}`);
  console.log(`Snapshot: ${artifacts.snapshot_markdown}`);
  console.log(`File economy: ${report.file_economy.provisional_score}/100 ${economyScoreLabel} (${report.file_economy.status})`);
  return 0;
}

if (require.main === module) {
  try {
    process.exit(runCodebaseStoryReviewReport());
  } catch (error) {
    console.error(`Codebase story review failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  loadJson,
  runCodebaseStoryReviewReport,
};
