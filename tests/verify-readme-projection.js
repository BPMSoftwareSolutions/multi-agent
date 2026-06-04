// warehouse:file
// responsibility: Verifies generated README projections use taxonomy scan and story review source truth and detect documentation drift
// actor: readme_projection_test
// role: verification
// source_truth: implementation

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  buildReadmeProjection,
  buildReadmeStalenessReport,
  extractReadmeMetadata,
  formatReadmeProjection,
  formatReadmeStalenessMarkdown,
  writeReadmeProjection,
} = require("../src/observability/readme-projection");

// warehouse:method
// responsibility: Verifies generated README projections use taxonomy scan and story review source truth and detect documentation drift
// actor: method_implementation
// role: implementation
// source_truth: implementation
function sampleScan() {
  return {
    run_id: "scan-readme-test",
    summary: {
      files_scanned: 3,
      file_anchors_found: 3,
      method_anchors_found: 4,
      detected_methods: 4,
      folder_coherence: 100,
      strong_count: 3,
      weak_count: 0,
      missing_count: 0,
    },
  };
}

// warehouse:method
// responsibility: Verifies generated README projections use taxonomy scan and story review source truth and detect documentation drift
// actor: method_implementation
// role: implementation
// source_truth: implementation
function sampleStoryReview() {
  return {
    report_id: "codebase-story-review-test",
    story_governance: {
      status: "earned",
      canonical_residue_gate: "pass",
      overall_story_coherence: "100/100 earned",
    },
    file_economy: {
      status: "pass",
      signals: {
        small_boundary_reviewed_count: 2,
        small_boundary_unearned_count: 0,
        consolidation_candidate_count: 0,
      },
    },
    legacy_residue: {
      residue_pressure: 0,
      canonical_surface_map: [
        {
          surface_type: "Taxonomy scan report",
          canonical_surface: "src/observability/taxonomy-scan-report.js",
          relationship: "canonical renderer",
          decision: "document boundary",
          boundary_evidence: "Renderer owns scan report projection.",
        },
      ],
      residue_queue: [],
    },
  };
}

// warehouse:method
// responsibility: Verifies generated README projections use taxonomy scan and story review source truth and detect documentation drift
// actor: method_implementation
// role: implementation
// source_truth: implementation
function verifyProjectionModel() {
  const projection = buildReadmeProjection(sampleScan(), sampleStoryReview());
  assert.strictEqual(projection.source_scan, "scan-readme-test");
  assert.strictEqual(projection.source_story_review, "codebase-story-review-test");
  assert.strictEqual(projection.do_not_hand_edit, true);
  assert.strictEqual(projection.regeneration_command, "npm run taxonomy:readme");
  assert.strictEqual(projection.coherence_posture, "local_taxonomy_clean");
  assert.strictEqual(projection.story_posture, "earned");
  assert.strictEqual(projection.summary.overall_story_coherence, "100/100 earned");
  return projection;
}

// warehouse:method
// responsibility: Verifies generated README projections use taxonomy scan and story review source truth and detect documentation drift
// actor: method_implementation
// role: implementation
// source_truth: implementation
function verifyMarkdownProjection(projection) {
  const markdown = formatReadmeProjection(projection);
  assert.match(markdown, /GENERATED:README_PROJECTION:BEGIN/);
  assert.match(markdown, /source_scan: scan-readme-test/);
  assert.match(markdown, /source_story_review: codebase-story-review-test/);
  assert.match(markdown, /do_not_hand_edit: true/);
  assert.match(markdown, /README Integrity Rule/);
  assert.match(markdown, /Taxonomy scan report/);
  assert.match(markdown, /No residue queue items/);
  assert.doesNotMatch(markdown, /Everything is clean/);
  return markdown;
}

// warehouse:method
// responsibility: Verifies generated README projections use taxonomy scan and story review source truth and detect documentation drift
// actor: method_implementation
// role: implementation
// source_truth: implementation
function verifyStaleness(markdown) {
  const scan = sampleScan();
  const story = sampleStoryReview();
  const current = buildReadmeStalenessReport(markdown, scan, story);
  assert.strictEqual(current.stale_count, 0);
  assert.strictEqual(current.rows[0].status, "current");
  const stale = buildReadmeStalenessReport(markdown.replace("scan-readme-test", "scan-old"), scan, story);
  assert.strictEqual(stale.stale_count, 1);
  assert.strictEqual(stale.rows[0].status, "stale");
  assert.deepStrictEqual(extractReadmeMetadata(markdown), {
    source_scan: "scan-readme-test",
    source_story_review: "codebase-story-review-test",
  });
  assert.match(formatReadmeStalenessMarkdown(current), /✅ current/);
  assert.match(formatReadmeStalenessMarkdown(stale), /⚠ stale/);
}

// warehouse:method
// responsibility: Verifies generated README projections use taxonomy scan and story review source truth and detect documentation drift
// actor: method_implementation
// role: implementation
// source_truth: implementation
function verifyWriter() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "readme-projection-"));
  fs.mkdirSync(path.join(tmp, "reports"));
  fs.writeFileSync(path.join(tmp, "reports", "scan-report-latest.json"), JSON.stringify(sampleScan(), null, 2));
  fs.writeFileSync(path.join(tmp, "reports", "codebase-story-review-latest.json"), JSON.stringify(sampleStoryReview(), null, 2));
  const artifacts = writeReadmeProjection(tmp);
  assert(fs.existsSync(path.join(tmp, "README.md")));
  assert(fs.existsSync(path.join(tmp, "reports", "readme-projection-latest.json")));
  assert(fs.existsSync(path.join(tmp, "reports", "README-PROJECTION-LATEST.md")));
  assert.strictEqual(artifacts.staleness.stale_count, 0);
}

const projection = verifyProjectionModel();
const markdown = verifyMarkdownProjection(projection);
verifyStaleness(markdown);
verifyWriter();
console.log("README projection verification passed.");
