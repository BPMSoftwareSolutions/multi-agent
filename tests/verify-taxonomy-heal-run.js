#!/usr/bin/env node
// warehouse:file
// responsibility: Verifies observable taxonomy healing run keeps status JSON and markdown projections aligned while data driven expected remediation heals an incoherent fixture
// actor: taxonomy_heal_run_test
// role: validator
// source_truth: implementation

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const {
  formatHealingMarkdown,
  runObservableTaxonomyHeal,
  writeHealingStatus,
} = require("../bin/taxonomy-heal-run");

// warehouse:method
// responsibility: Verifies observable taxonomy healing run keeps status JSON and markdown projections aligned while data driven expected remediation heals an incoherent fixture
// actor: method_implementation
// role: implementation
// source_truth: implementation
function assertCurrentRunMatchesStatus(reportsDir, runDir, expectedStatus) {
  const latestStatus = JSON.parse(fs.readFileSync(path.join(reportsDir, "taxonomy-heal-status-latest.json"), "utf8"));
  const runStatus = JSON.parse(fs.readFileSync(path.join(runDir, "status.json"), "utf8"));
  const currentRun = fs.readFileSync(path.join(reportsDir, "CURRENT-RUN.md"), "utf8");

  assert.deepStrictEqual(runStatus, latestStatus, "run status and latest status should match");
  assert.deepStrictEqual(latestStatus, expectedStatus, "latest status should match returned status");
  assert.strictEqual(currentRun, formatHealingMarkdown(latestStatus), "markdown should project latest status exactly");
  assert.ok(currentRun.includes(`| Target file | ${latestStatus.target_file} |`), "markdown should include status target");
  assert.ok(currentRun.includes(`| Phase | ${latestStatus.phase} |`), "markdown should include status phase");
  assert.ok(currentRun.includes(`| Current action | ${latestStatus.current_action} |`), "markdown should include status action");
}

// warehouse:method
// responsibility: Verifies observable taxonomy healing run keeps status JSON and markdown projections aligned while data driven expected remediation heals an incoherent fixture
// actor: method_implementation
// role: implementation
// source_truth: implementation
function verifyStatusWriteProjectionAlignment() {
  const root = path.resolve(__dirname, "..");
  const reportsDir = path.join(root, ".tmp", "observable-write-reports");
  const runDir = path.join(reportsDir, "taxonomy-heal-runs", "projection-test");
  fs.rmSync(reportsDir, { recursive: true, force: true });

  try {
    const startStatus = writeHealingStatus(reportsDir, runDir, {
      schema: "taxonomy-heal-run-status.v1",
      run_id: "projection-test",
      state: "running",
      target_file: "bin/example.js",
      phase: "start",
      current_action: "initializing single-file taxonomy healing run",
      expected_taxonomy: null,
      case_dir: null,
      score_before: null,
      score_after: null,
      evidence_trustworthy: null,
    });
    assertCurrentRunMatchesStatus(reportsDir, runDir, startStatus);

    const verifyStatus = writeHealingStatus(reportsDir, runDir, {
      ...startStatus,
      state: "done",
      phase: "verify",
      current_action: "single-file healing run complete",
      expected_taxonomy: "reports/taxonomy-case-files/bin__example/expected-coherence.json",
      case_dir: "reports/taxonomy-case-files/bin__example",
      score_before: 50,
      score_after: 100,
      evidence_trustworthy: true,
    });
    assertCurrentRunMatchesStatus(reportsDir, runDir, verifyStatus);
  } finally {
    fs.rmSync(reportsDir, { recursive: true, force: true });
  }
}

// warehouse:method
// responsibility: Verifies observable taxonomy healing run keeps status JSON and markdown projections aligned while data driven expected remediation heals an incoherent fixture
// actor: method_implementation
// role: implementation
// source_truth: implementation
function verifyObservableHealingRun() {
  const root = path.resolve(__dirname, "..");
  const fixtureDir = path.join(root, ".tmp");
  const reportsDir = path.join(root, ".tmp", "observable-heal-reports");
  const fixturePath = path.join(fixtureDir, "observable-heal.fixture.js");
  const fixtureRelPath = path.relative(root, fixturePath).replace(/\\/g, "/");
  fs.mkdirSync(fixtureDir, { recursive: true });
  fs.rmSync(reportsDir, { recursive: true, force: true });
  fs.writeFileSync(
    fixturePath,
    [
      "// warehouse:file",
      "// responsibility: Provides readProgress, formatTimeDiff functionality",
      "// actor: progress_monitor",
      "// role: watcher",
      "// source_truth: implementation",
      "",
      "// warehouse:method",
      "// responsibility: Parses worker-bee log for packet completion events and counts completed files",
      "// actor: method_implementation",
      "// role: implementation",
      "// source_truth: implementation",
      "function readProgress() {",
      "  return 1;",
      "}",
      "",
      "// warehouse:method",
      "// responsibility: Formats elapsed milliseconds into stall detection duration labels",
      "// actor: method_implementation",
      "// role: implementation",
      "// source_truth: implementation",
      "function formatTimeDiff() {",
      "  return 'now';",
      "}",
      "",
    ].join("\n"),
    "utf8"
  );

  try {
    const status = runObservableTaxonomyHeal(fixtureRelPath, root, reportsDir);
    const runDir = path.join(reportsDir, "taxonomy-heal-runs", status.run_id);
    const currentRun = fs.readFileSync(path.join(reportsDir, "CURRENT-RUN.md"), "utf8");

    assert.strictEqual(status.state, "done", "observable healing run should complete");
    assert.ok(status.score_before < 100, "fixture should start incoherent");
    assert.strictEqual(status.score_after, 100, "fixture should heal to 100/100");
    assert.strictEqual(status.evidence_trustworthy, true, "post-heal evidence should be trustworthy");
    assert.ok(currentRun.includes("TAXONOMY HEALING OBSERVABILITY CONSOLE"), "markdown should include ascii console");
    assert.ok(currentRun.includes("[GREEN:DONE]"), "markdown should show status color badge");
    assert.ok(currentRun.includes("start:ok -> case:ok -> expected:ok -> heal:ok -> evidence:ok -> [VERIFY]"), "markdown should show phase trail");
    assert.ok(currentRun.includes("\u2588".repeat(24) + " 100%"), "markdown should show contract-rendered progress bar");
    assert.ok(!currentRun.includes("[########################]"), "markdown should not use placeholder progress bars");
    assert.ok(currentRun.includes("## Executive Summary"), "markdown should include executive summary");
    assert.ok(currentRun.includes(`| Target file | ${fixtureRelPath} |`), "markdown should show target file");
    assert.ok(currentRun.includes("| Phase | verify |"), "markdown should show final phase");
    assert.ok(currentRun.includes("## Score Impact"), "markdown should include score impact");
    assert.ok(
      currentRun.includes(`| ${status.score_before}/100 | 100/100 | +${100 - status.score_before} | [GREEN:YES] | ${"\u2588".repeat(24)} 100% |`),
      "markdown should show healing impact"
    );
    assert.ok(currentRun.includes("## Evidence Artifacts"), "markdown should include artifact table");
    assertCurrentRunMatchesStatus(reportsDir, runDir, status);
  } finally {
    fs.rmSync(reportsDir, { recursive: true, force: true });
    fs.rmSync(fixturePath, { force: true });
  }
}

// warehouse:method
// responsibility: Verifies observable taxonomy healing run keeps status JSON and markdown projections aligned while data driven expected remediation heals an incoherent fixture
// actor: method_implementation
// role: implementation
// source_truth: implementation
function runTaxonomyHealRunVerification() {
  verifyStatusWriteProjectionAlignment();
  verifyObservableHealingRun();
  console.log("Taxonomy heal run verification passed.");
  return 0;
}

if (require.main === module) {
  process.exit(runTaxonomyHealRunVerification());
}

module.exports = {
  assertCurrentRunMatchesStatus,
  verifyObservableHealingRun,
  verifyStatusWriteProjectionAlignment,
  runTaxonomyHealRunVerification,
};
