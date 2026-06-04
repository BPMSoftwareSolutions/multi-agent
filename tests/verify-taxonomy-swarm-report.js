#!/usr/bin/env node
// warehouse:file
// responsibility: Verifies taxonomy swarm run reports render governed operator console summaries ledgers review queues semantic tie out and artifact projections from batch healing evidence
// actor: taxonomy_swarm_report_test
// role: validator
// source_truth: implementation

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const {
  buildSwarmRunReport,
  formatSwarmRunMarkdown,
  writeSwarmRunReport,
} = require("../src/observability/taxonomy-swarm-report");

// warehouse:method
// responsibility: Verifies taxonomy swarm run reports render governed operator console summaries ledgers review queues semantic tie out and artifact projections from batch healing evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function sampleSwarmRunInput() {
  return {
    run_id: "swarm-report-test",
    status: "done",
    target_scope: "src/**, bin/**",
    bee_count: 3,
    started_at: "2026-06-04T16:20:12.911Z",
    completed_at: "2026-06-04T16:20:18.911Z",
    generated_at: "2026-06-04T16:20:19.111Z",
    source_mutation_policy: "governed / case-scoped / evidence-backed",
    files: [
      {
        file: "src/observability/ascii-components.js",
        bee: "bee-01",
        before_score: 100,
        after_score: 100,
        mutation_class: "evidence_refresh",
        source_mutated: false,
        evidence_trustworthy: true,
        verdict: "trusted_noop",
        next_action: "none",
      },
      {
        file: "src/taxonomy/text-utils.js",
        bee: "bee-01",
        before_score: 10,
        after_score: 92,
        mutation_class: "scorer_review_required",
        source_mutated: false,
        evidence_trustworthy: true,
        verdict: "likely_true_low_vocab_overlap",
        next_action: "upgrade scorer",
        review_reason: "Current scorer misread clear utility tie-out as incoherent.",
        suggested_action: "Improve semantic tie-out evaluator.",
      },
      {
        file: "src/taxonomy/run-file-swarm.js",
        bee: "bee-02",
        before_score: 11,
        after_score: 74,
        mutation_class: "file_anchor_repair",
        source_mutated: true,
        evidence_trustworthy: true,
        verdict: "story_repaired",
        next_action: "review anchor diff",
      },
      {
        file: "src/core/session-store.js",
        bee: "bee-02",
        before_score: 24,
        after_score: 68,
        mutation_class: "method_anchor_repair",
        source_mutated: true,
        evidence_trustworthy: true,
        verdict: "mostly_aligned",
        next_action: "monitor",
      },
      {
        file: "src/shared/actions.js",
        bee: "bee-03",
        before_score: 17,
        after_score: 41,
        mutation_class: "file_split_required",
        source_mutated: false,
        evidence_trustworthy: true,
        verdict: "split_candidate",
        next_action: "create refactor packet",
        review_reason: "Mixed responsibility file collapsed into one file.",
        suggested_action: "Split registry, queue manager, worker executor, and summary reporter.",
      },
      {
        file: "src/api/gemini-client.js",
        bee: "bee-03",
        before_score: 16,
        after_score: 85,
        mutation_class: "file_anchor_repair",
        source_mutated: true,
        evidence_trustworthy: true,
        verdict: "trusted_story",
        next_action: "none",
      },
    ],
  };
}

// warehouse:method
// responsibility: Verifies taxonomy swarm run reports render governed operator console summaries ledgers review queues semantic tie out and artifact projections from batch healing evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function verifySwarmRunReportProjection() {
  const report = buildSwarmRunReport(sampleSwarmRunInput());
  const markdown = formatSwarmRunMarkdown(report);

  assert.strictEqual(report.schema, "taxonomy-healing-swarm-report.v1", "report should use governed swarm schema");
  assert.strictEqual(report.summary.files_total, 6, "summary should count scoped files");
  assert.strictEqual(report.summary.files_completed, 6, "summary should count completed files");
  assert.strictEqual(report.summary.files_source_mutated, 3, "summary should count source mutations");
  assert.strictEqual(report.summary.evidence_only_refreshes, 1, "summary should count evidence refreshes");
  assert.strictEqual(report.summary.human_review_required, 2, "summary should count explicit review queue items");
  assert.strictEqual(report.summary.before_health, 30, "summary should compute average before health");
  assert.strictEqual(report.summary.after_health, 77, "summary should compute average after health");
  assert.strictEqual(report.summary.net_delta, "+47", "summary should compute net movement");
  assert.strictEqual(report.score_movement.weak.delta, -4, "score movement should prove weak story reduction");
  assert.strictEqual(report.mutation_class_summary.file_anchor_repair.count, 2, "mutation class summary should classify anchor repairs");
  assert.strictEqual(report.bee_ledger.length, 3, "bee ledger should aggregate worker lanes");
  assert.strictEqual(report.file_ledger.length, 6, "file ledger should keep every file visible");
  assert.strictEqual(report.review_queue.length, 2, "review queue should not hide architecture decisions");

  assert.ok(markdown.includes("TAXONOMY HEALING SWARM OBSERVABILITY CONSOLE"), "markdown should include swarm console");
  assert.ok(markdown.includes("Status        ✅ DONE"), "console should use icon-first status");
  assert.ok(markdown.includes("Target Scope  📁 src/**, bin/**"), "console should show target scope with icon");
  assert.ok(markdown.includes("Bee Count     🐝 3 workers"), "console should show worker count with icon");
  assert.ok(markdown.includes("Files         6 total | 6 completed | 0 running | 0 blocked"), "console should summarize file progress");
  assert.ok(markdown.includes("Source Mut.   3 files mutated | 3 no source mutation"), "console should summarize mutation posture");
  assert.ok(markdown.includes("Evidence      ✅ 6/6 trustworthy"), "console should show evidence trust count");
  assert.ok(markdown.includes("Escalations   ⚠ 2 human/operator review items"), "console should surface review load");
  assert.ok(markdown.includes("## Executive Summary"), "markdown should include executive summary");
  assert.ok(markdown.includes("## Score Movement"), "markdown should include score movement");
  assert.ok(markdown.includes("## Mutation Class Summary"), "markdown should include mutation class summary");
  assert.ok(markdown.includes("## Bee Workload Ledger"), "markdown should include worker workload ledger");
  assert.ok(markdown.includes("## File Healing Ledger"), "markdown should include file healing ledger");
  assert.ok(markdown.includes("✏ YES"), "file ledger should show source mutation icon");
  assert.ok(markdown.includes("🔒 NO"), "file ledger should show no mutation lock icon");
  assert.ok(markdown.includes("## Human Review Queue"), "markdown should include human review queue");
  assert.ok(markdown.includes("## Semantic Tie-Out Summary"), "markdown should include semantic tie-out summary");
  assert.ok(markdown.includes("## Evidence Artifact Index"), "markdown should include artifact index");
  assert.ok(markdown.includes("## Final Verdict"), "markdown should include final verdict");
  assert.ok(markdown.includes("The taxonomy healing swarm completed successfully."), "done verdict should be operator-readable");
  assert.ok(!markdown.includes("[GREEN:"), "markdown should not use debug color labels");
}

// warehouse:method
// responsibility: Verifies taxonomy swarm run reports render governed operator console summaries ledgers review queues semantic tie out and artifact projections from batch healing evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function verifySwarmRunReportArtifacts() {
  const root = path.resolve(__dirname, "..");
  const reportsDir = path.join(root, ".tmp", "taxonomy-swarm-report");
  fs.rmSync(reportsDir, { recursive: true, force: true });

  try {
    const report = buildSwarmRunReport(sampleSwarmRunInput());
    const written = writeSwarmRunReport(report, reportsDir);
    const batchReport = JSON.parse(fs.readFileSync(written.batch_report_json, "utf8"));
    const batchMarkdown = fs.readFileSync(written.batch_report_markdown, "utf8");
    const currentRun = fs.readFileSync(path.join(reportsDir, "CURRENT-RUN.md"), "utf8");
    const beeLedger = JSON.parse(fs.readFileSync(written.bee_ledger_json, "utf8"));
    const fileLedger = JSON.parse(fs.readFileSync(written.file_ledger_json, "utf8"));
    const reviewQueue = JSON.parse(fs.readFileSync(written.review_queue_json, "utf8"));

    assert.deepStrictEqual(batchReport, report, "batch report JSON should preserve report object");
    assert.strictEqual(batchMarkdown, formatSwarmRunMarkdown(batchReport), "batch markdown should project JSON exactly");
    assert.strictEqual(currentRun, batchMarkdown, "current run should point at latest swarm projection");
    assert.strictEqual(beeLedger.length, 3, "bee ledger artifact should be written");
    assert.strictEqual(fileLedger.length, 6, "file ledger artifact should be written");
    assert.strictEqual(reviewQueue.length, 2, "review queue artifact should be written");
    assert.ok(fs.existsSync(written.evidence_manifest_json), "evidence manifest should be written");
  } finally {
    fs.rmSync(reportsDir, { recursive: true, force: true });
  }
}

// warehouse:method
// responsibility: Verifies taxonomy swarm run reports render governed operator console summaries ledgers review queues semantic tie out and artifact projections from batch healing evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function runTaxonomySwarmReportVerification() {
  verifySwarmRunReportProjection();
  verifySwarmRunReportArtifacts();
  console.log("Taxonomy swarm report verification passed.");
  return 0;
}

if (require.main === module) {
  process.exit(runTaxonomySwarmReportVerification());
}

module.exports = {
  sampleSwarmRunInput,
  verifySwarmRunReportArtifacts,
  verifySwarmRunReportProjection,
  runTaxonomySwarmReportVerification,
};
