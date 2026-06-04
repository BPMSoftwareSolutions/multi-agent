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
      files_scanned: 8,
      file_anchors_found: 8,
      method_anchor_files: 5,
      method_anchors_found: 8,
      detected_methods: 8,
      folder_coherence: 100,
      strong_count: 8,
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
        file: "src/story-analysis/report-formatter.js",
        file_anchor_found: true,
        detected_methods: 2,
        documented_methods: 2,
        score: 100,
        band: "strong",
      },
      {
        file: "src/observability/codebase-story-review-report.js",
        file_anchor_found: true,
        detected_methods: 18,
        documented_methods: 18,
        score: 100,
        band: "strong",
      },
      {
        file: "bin/runs-report.js",
        file_anchor_found: true,
        detected_methods: 1,
        documented_methods: 1,
        score: 100,
        band: "strong",
      },
      {
        file: "bin/taxonomy-heal.js",
        file_anchor_found: true,
        detected_methods: 1,
        documented_methods: 1,
        score: 100,
        band: "strong",
      },
      {
        file: "src/worker-bee/report.js",
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
        score: 99,
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
  assert.strictEqual(report.story_governance.status, "earned");
  assert.strictEqual(report.story_governance.overall_story_coherence, "100/100 earned");
  assert.strictEqual(report.story_governance.filesystem_story_gate, "pass");
  assert.strictEqual(report.story_governance.readme_alignment_gate, "pass");
  assert.strictEqual(report.filesystem_story.status, "pass");
  assert.strictEqual(report.filesystem_story.score, 100);
  assert.strictEqual(report.readme_alignment.status, "pass");
  assert.strictEqual(report.readme_alignment.stale_count, 0);
  assert.strictEqual(report.file_economy.status, "pass");
  assert.strictEqual(report.file_economy.provisional_score, 100);
  assert.strictEqual(report.legacy_residue.status, "pass");
  assert.strictEqual(report.legacy_residue.residue_pressure, 0);
  assert.strictEqual(report.file_economy.signals.consolidation_candidate_count, 0);
  assert(report.file_economy.signals.small_boundary_reviewed_count > 0);
  assert.match(report.primary_review_question, /Do all 8 files earn their boundaries/);
  assert(report.file_economy.category_rows.some((row) => row.category === "Zero-method files"));
  assert(report.legacy_residue.canonical_surface_map.some((row) => row.surface_type === "Story review report"));
  assert.strictEqual(report.legacy_residue.compatibility_shells, 0);
  assert.strictEqual(report.legacy_residue.unclear_overlap, 0);
  assert.strictEqual(report.legacy_residue.remove_candidates, 0);
  return report;
}

// warehouse:method
// responsibility: Verifies codebase story review report generation separates taxonomy coherence from file economy review and renders operator narrative evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function verifyBlockedModel() {
  const scan = sampleScan();
  scan.summary.files_scanned += 1;
  scan.summary.file_anchors_found += 1;
  scan.summary.strong_count += 1;
  scan.file_ledger.push({
    file: "misc/ambiguous-helper.js",
    file_anchor_found: true,
    detected_methods: 1,
    documented_methods: 1,
    score: 100,
    band: "strong",
  });
  const report = buildReport(scan, { run_id: "swarm-test" });
  assert.strictEqual(report.summary.local_taxonomy_tie_out, 100);
  assert.strictEqual(report.story_governance.status, "not_yet_earned");
  assert.strictEqual(report.story_governance.filesystem_story_gate, "review required");
  assert.strictEqual(report.filesystem_story.path_language_issues, 1);
  assert.strictEqual(report.file_economy.status, "review required");
  assert.strictEqual(report.file_economy.signals.consolidation_candidate_count, 1);
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
  assert.match(markdown, /STORY COHERENCE EARNED/);
  assert.match(markdown, /Local Tie-Out/);
  assert.match(markdown, /Filesystem Story Review/);
  assert.match(markdown, /Filesystem story gate/);
  assert.match(markdown, /README Alignment Review/);
  assert.match(markdown, /README alignment gate/);
  assert.match(markdown, /Local Tie-Out is not the same as Codebase Story Coherence/);
  assert.match(markdown, /Overall story coherence/);
  assert.match(markdown, /100\/100 earned/);
  assert.match(markdown, /File Economy Review/);
  assert.match(markdown, /Small boundaries reviewed/);
  assert.match(markdown, /Legacy Idea Residue Review/);
  assert.match(markdown, /Residue Pressure Breakdown/);
  assert.match(markdown, /Residue pressure counts canonical-surface relationship risks/);
  assert.match(markdown, /Canonical Surface Map/);
  assert.match(markdown, /standing doctrine remains: local truth is not automatically whole truth/);
  assert.match(markdown, /Residue review proves the file still belongs/);
  assert.match(markdown, /Overall story coherence \| 100\/100 earned/);
  assert.match(markdown, /File economy score \| 100\/100 earned/);
  assert.match(markdown, /Accept the 100\/100 file-economy pass/);
  assert.match(markdown, /No consolidation required from this scan/);
  assert.doesNotMatch(markdown, /Mark as review required with a 70\/100 provisional score/);
  assert.doesNotMatch(markdown, /The economy review remains open around small files/);
  assert.doesNotMatch(markdown, /The remaining review question is whether zero-method and one-method files/);
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
verifyBlockedModel();
verifyMarkdown(report);
verifyWriter(report);
console.log("Codebase story review report verification passed.");
