// warehouse:file
// responsibility: Verifies codebase story review report generation separates taxonomy coherence from file economy review and renders operator narrative evidence
// actor: codebase_story_review_test
// role: verification
// source_truth: implementation

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  buildReport,
  formatMarkdown,
  writeCodebaseStoryReviewReport,
} = require("../src/observability/codebase-story-review-report");

// warehouse:method
// responsibility: Verifies codebase story review report generation separates taxonomy coherence from file economy review and renders operator narrative evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function sampleScan() {
  return {
    run_id: "scan-test",
    target_path: ".",
    summary: {
      files_scanned: 3,
      file_anchors_found: 3,
      method_anchor_files: 2,
      method_anchors_found: 4,
      detected_methods: 4,
      folder_coherence: 100,
      strong_count: 3,
      moderate_count: 0,
      weak_count: 0,
      missing_count: 0,
      scorer_review_count: 0,
      healing_recommended_count: 0,
    },
    file_ledger: [
      {
        file: "bin/demo.js",
        file_anchor_found: true,
        detected_methods: 1,
        documented_methods: 1,
        score: 100,
        band: "strong",
      },
      {
        file: "src/worker-bee/demo-worker.js",
        file_anchor_found: true,
        detected_methods: 3,
        documented_methods: 3,
        score: 100,
        band: "strong",
      },
      {
        file: "server/index.js",
        file_anchor_found: true,
        detected_methods: 0,
        documented_methods: 0,
        score: 100,
        band: "strong",
      },
    ],
  };
}

// warehouse:method
// responsibility: Verifies codebase story review report generation separates taxonomy coherence from file economy review and renders operator narrative evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function verifyReportModel() {
  const report = buildReport(sampleScan(), { run_id: "swarm-test" });
  assert.strictEqual(report.summary.codebase_coherence, 100);
  assert.strictEqual(report.file_economy.status, "review required");
  assert.strictEqual(report.file_economy.provisional_score, 70);
  assert.match(report.primary_review_question, /Do we need 3 files/);
  assert(report.file_economy.category_rows.some((row) => row.category === "Zero-method files"));
  return report;
}

// warehouse:method
// responsibility: Verifies codebase story review report generation separates taxonomy coherence from file economy review and renders operator narrative evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function verifyMarkdown(report) {
  const markdown = formatMarkdown(report);
  assert.match(markdown, /# Codebase Story Review Report/);
  assert.match(markdown, /CODEBASE STORY REVIEW/);
  assert.match(markdown, /File Economy/);
  assert.match(markdown, /Coherence tells us whether the story is true/);
  assert.match(markdown, /File Economy Review/);
  assert.doesNotMatch(markdown, /Taxonomy Story Report/);
  return markdown;
}

// warehouse:method
// responsibility: Verifies codebase story review report generation separates taxonomy coherence from file economy review and renders operator narrative evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function verifyWriter(report) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "codebase-story-review-"));
  const artifacts = writeCodebaseStoryReviewReport(report, tmp);
  assert(fs.existsSync(artifacts.latest_markdown));
  assert(fs.existsSync(artifacts.snapshot_markdown));
  assert(fs.existsSync(artifacts.latest_json));
  assert.match(fs.readFileSync(artifacts.latest_markdown, "utf8"), /Current Story Snapshot/);
}

const report = verifyReportModel();
verifyMarkdown(report);
verifyWriter(report);
console.log("Codebase story review report verification passed.");
