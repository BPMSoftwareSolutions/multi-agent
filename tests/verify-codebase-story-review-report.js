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
      files_scanned: 5,
      file_anchors_found: 5,
      method_anchor_files: 2,
      method_anchors_found: 5,
      detected_methods: 5,
      folder_coherence: 100,
      strong_count: 5,
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
        file: "bin/generate-story-report.js",
        file_anchor_found: true,
        detected_methods: 0,
        documented_methods: 0,
        score: 100,
        band: "strong",
      },
      {
        file: "bin/story-report-formatter.js",
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
  assert.strictEqual(report.summary.local_taxonomy_tie_out, 100);
  assert.strictEqual(report.story_governance.status, "not_yet_earned");
  assert.strictEqual(report.story_governance.overall_story_coherence, "not yet earned");
  assert.strictEqual(report.file_economy.status, "review required");
  assert.strictEqual(report.file_economy.provisional_score, 70);
  assert.strictEqual(report.legacy_residue.status, "review required");
  assert(report.legacy_residue.residue_pressure > 0);
  assert.match(report.primary_review_question, /Do all 5 files earn their boundaries/);
  assert(report.file_economy.category_rows.some((row) => row.category === "Zero-method files"));
  assert(report.legacy_residue.canonical_surface_map.some((row) => row.surface_type === "Story review report"));
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
  assert.match(markdown, /STORY COHERENCE NOT YET EARNED/);
  assert.match(markdown, /Local Tie-Out/);
  assert.match(markdown, /Overall story coherence/);
  assert.match(markdown, /not yet earned/);
  assert.match(markdown, /File Economy Review/);
  assert.match(markdown, /Legacy Idea Residue Review/);
  assert.match(markdown, /Canonical Surface Map/);
  assert.match(markdown, /Local truth is not whole truth/);
  assert.match(markdown, /Residue review proves the file still belongs/);
  assert.doesNotMatch(markdown, /Taxonomy Story Report/);
  assert.doesNotMatch(markdown, /Status\\s+✅ STORY COHERENT/);
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
