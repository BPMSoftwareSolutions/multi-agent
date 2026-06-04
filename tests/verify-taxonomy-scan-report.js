#!/usr/bin/env node
// warehouse:file
// responsibility: Verifies read only taxonomy coherence scan reports render folder posture ledgers findings latest root copies and artifact projections without mutating source
// actor: taxonomy_scan_report_test
// role: validator
// source_truth: implementation

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const {
  buildScanReport,
  formatScanMarkdown,
  scanTargetPath,
  writeScanReport,
} = require("../src/observability/taxonomy-scan-report");

// warehouse:method
// responsibility: Verifies read only taxonomy coherence scan reports render folder posture ledgers findings latest root copies and artifact projections without mutating source
// actor: method_implementation
// role: implementation
// source_truth: implementation
function sampleScanInput() {
  return {
    run_id: "scan-report-test",
    status: "complete",
    target_path: "src/observability",
    started_at: "2026-06-04T16:10:00.000Z",
    completed_at: "2026-06-04T16:10:01.000Z",
    generated_at: "2026-06-04T16:10:01.100Z",
    duration: "1.0s",
    files: [
      {
        file: "src/observability/ascii-components.js",
        file_anchor_found: true,
        detected_methods: 9,
        documented_methods: 9,
        score: 100,
        scorer_review: false,
      },
      {
        file: "src/observability/progress-console.js",
        file_anchor_found: true,
        detected_methods: 6,
        documented_methods: 6,
        score: 88,
        scorer_review: false,
      },
      {
        file: "src/observability/status-icons.js",
        file_anchor_found: true,
        detected_methods: 5,
        documented_methods: 4,
        score: 76,
        scorer_review: false,
      },
      {
        file: "src/observability/legacy-printer.js",
        file_anchor_found: true,
        detected_methods: 7,
        documented_methods: 7,
        score: 32,
        scorer_review: true,
      },
      {
        file: "src/observability/temp-helper.js",
        file_anchor_found: false,
        detected_methods: 3,
        documented_methods: 0,
        score: 0,
        scorer_review: false,
      },
    ],
  };
}

// warehouse:method
// responsibility: Verifies read only taxonomy coherence scan reports render folder posture ledgers findings latest root copies and artifact projections without mutating source
// actor: method_implementation
// role: implementation
// source_truth: implementation
function verifyScanReportProjection() {
  const report = buildScanReport(sampleScanInput());
  const markdown = formatScanMarkdown(report);

  assert.strictEqual(report.schema, "taxonomy-coherence-scan-report.v1", "scan report should use governed schema");
  assert.strictEqual(report.summary.files_scanned, 5, "summary should count scanned files");
  assert.strictEqual(report.summary.file_anchors_found, 4, "summary should count file anchors");
  assert.strictEqual(report.summary.method_anchor_files, 4, "summary should count files with method anchors");
  assert.strictEqual(report.summary.folder_coherence, 59, "summary should average file scores");
  assert.strictEqual(report.summary.strong_count, 2, "summary should count strong files");
  assert.strictEqual(report.summary.moderate_count, 1, "summary should count moderate files");
  assert.strictEqual(report.summary.weak_count, 1, "summary should count weak files");
  assert.strictEqual(report.summary.missing_count, 1, "summary should count missing taxonomy");
  assert.strictEqual(report.summary.scorer_review_count, 1, "summary should count scorer review candidates");
  assert.strictEqual(report.file_ledger.length, 5, "file ledger should include every file");
  assert.ok(report.finding_ledger.length >= 3, "finding ledger should make scan actionable");

  assert.ok(markdown.includes("TAXONOMY COHERENCE SCAN"), "markdown should include scan console");
  assert.ok(markdown.includes("Status        ✅ COMPLETE"), "console should use icon status");
  assert.ok(markdown.includes("Target        📁 src/observability"), "console should show target folder");
  assert.ok(markdown.includes("Mode          🔎 READ ONLY"), "console should show read-only scan mode");
  assert.ok(markdown.includes("Files         5 scanned | 4 with file anchors | 4 with method anchors"), "console should summarize anchors");
  assert.ok(markdown.includes("Coherence     59/100"), "console should show folder coherence");
  assert.ok(markdown.includes("Mutation      🔒 NONE"), "console should show no source mutation");
  assert.ok(markdown.includes("Next Action   🧾 2 files recommended for healing"), "console should route next action");
  assert.ok(markdown.includes("## Executive Summary"), "markdown should include executive summary");
  assert.ok(markdown.includes("## Coherence Band Summary"), "markdown should include band summary");
  assert.ok(markdown.includes("## Folder Story"), "markdown should include folder story");
  assert.ok(markdown.includes("## File Coherence Ledger"), "markdown should include file ledger");
  assert.ok(markdown.includes("## Top Findings"), "markdown should include top findings");
  assert.ok(markdown.includes("## Read-Only Assurance"), "markdown should include read-only assurance");
  assert.ok(markdown.includes("| Source mutation | 🔒 NONE |"), "read-only assurance should prohibit source mutation");
  assert.ok(markdown.includes("## Evidence Artifacts"), "markdown should include artifact index");
  assert.ok(markdown.includes("reports/SCAN-REPORT-LATEST.md"), "artifact index should expose latest root markdown");
  assert.ok(markdown.includes("The taxonomy coherence scan completed"), "markdown should include final verdict");
}

// warehouse:method
// responsibility: Verifies read only taxonomy coherence scan reports render folder posture ledgers findings latest root copies and artifact projections without mutating source
// actor: method_implementation
// role: implementation
// source_truth: implementation
function verifyScanReportArtifacts() {
  const root = path.resolve(__dirname, "..");
  const reportsDir = path.join(root, ".tmp", "taxonomy-scan-report");
  fs.rmSync(reportsDir, { recursive: true, force: true });

  try {
    const report = buildScanReport(sampleScanInput());
    const written = writeScanReport(report, reportsDir);
    const scanJson = JSON.parse(fs.readFileSync(written.scan_report_json, "utf8"));
    const scanMarkdown = fs.readFileSync(written.scan_report_markdown, "utf8");
    const rootLatestMarkdown = fs.readFileSync(path.join(reportsDir, "SCAN-REPORT-LATEST.md"), "utf8");
    const currentRun = fs.readFileSync(path.join(reportsDir, "CURRENT-RUN.md"), "utf8");
    const rootLatestJson = JSON.parse(fs.readFileSync(path.join(reportsDir, "scan-report-latest.json"), "utf8"));
    const fileLedger = JSON.parse(fs.readFileSync(written.file_ledger_json, "utf8"));
    const findingLedger = JSON.parse(fs.readFileSync(written.finding_ledger_json, "utf8"));

    assert.deepStrictEqual(scanJson, report, "scan report JSON should preserve report object");
    assert.deepStrictEqual(rootLatestJson, report, "root latest JSON should preserve report object");
    assert.strictEqual(scanMarkdown, formatScanMarkdown(scanJson), "scan markdown should project JSON exactly");
    assert.strictEqual(rootLatestMarkdown, scanMarkdown, "root latest markdown should match run markdown");
    assert.strictEqual(currentRun, scanMarkdown, "current run should point at latest scan projection");
    assert.strictEqual(fileLedger.length, 5, "file ledger artifact should be written");
    assert.ok(findingLedger.length >= 3, "finding ledger artifact should be written");
  } finally {
    fs.rmSync(reportsDir, { recursive: true, force: true });
  }
}

// warehouse:method
// responsibility: Verifies read only taxonomy coherence scan reports render folder posture ledgers findings latest root copies and artifact projections without mutating source
// actor: method_implementation
// role: implementation
// source_truth: implementation
function verifyReadOnlyFixtureScan() {
  const root = path.resolve(__dirname, "..");
  const fixtureDir = path.join(root, ".tmp", "scan-fixture");
  const fixturePath = path.join(fixtureDir, "coherent.fixture.js");
  const missingPath = path.join(fixtureDir, "missing.fixture.js");
  fs.rmSync(fixtureDir, { recursive: true, force: true });
  fs.mkdirSync(fixtureDir, { recursive: true });
  fs.writeFileSync(
    fixturePath,
    [
      "// warehouse:file",
      "// responsibility: Coordinates scanFixture behavior with documented file and method taxonomy evidence",
      "// actor: scan_fixture",
      "// role: validator",
      "// source_truth: implementation",
      "",
      "// warehouse:method",
      "// responsibility: Coordinates scanFixture behavior with documented file and method taxonomy evidence",
      "// actor: method_implementation",
      "// role: implementation",
      "// source_truth: implementation",
      "function scanFixture() {",
      "  return true;",
      "}",
      "",
    ].join("\n"),
    "utf8"
  );
  fs.writeFileSync(
    missingPath,
    [
      "function missingFixture() {",
      "  return false;",
      "}",
      "",
    ].join("\n"),
    "utf8"
  );
  const before = {
    coherent: fs.readFileSync(fixturePath, "utf8"),
    missing: fs.readFileSync(missingPath, "utf8"),
  };

  try {
    const scan = scanTargetPath(fixtureDir, root);
    const report = buildScanReport({
      run_id: "read-only-fixture-scan",
      target_path: path.relative(root, fixtureDir).replace(/\\/g, "/"),
      started_at: "2026-06-04T16:10:00.000Z",
      completed_at: "2026-06-04T16:10:00.100Z",
      generated_at: "2026-06-04T16:10:00.100Z",
      files: scan.files,
    });

    assert.strictEqual(report.summary.files_scanned, 2, "fixture scan should discover files");
    assert.strictEqual(report.summary.file_anchors_found, 1, "fixture scan should identify file anchors");
    assert.strictEqual(report.summary.missing_count, 1, "fixture scan should classify missing taxonomy");
    assert.strictEqual(fs.readFileSync(fixturePath, "utf8"), before.coherent, "scan should not mutate anchored file");
    assert.strictEqual(fs.readFileSync(missingPath, "utf8"), before.missing, "scan should not mutate missing file");
  } finally {
    fs.rmSync(fixtureDir, { recursive: true, force: true });
  }
}

// warehouse:method
// responsibility: Verifies read only taxonomy coherence scan reports render folder posture ledgers findings latest root copies and artifact projections without mutating source
// actor: method_implementation
// role: implementation
// source_truth: implementation
function runTaxonomyScanReportVerification() {
  verifyScanReportProjection();
  verifyScanReportArtifacts();
  verifyReadOnlyFixtureScan();
  console.log("Taxonomy scan report verification passed.");
  return 0;
}

if (require.main === module) {
  process.exit(runTaxonomyScanReportVerification());
}

module.exports = {
  sampleScanInput,
  verifyReadOnlyFixtureScan,
  verifyScanReportArtifacts,
  verifyScanReportProjection,
  runTaxonomyScanReportVerification,
};
