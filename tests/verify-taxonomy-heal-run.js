#!/usr/bin/env node
// warehouse:file
// responsibility: Verifies observable taxonomy healing run updates contract driven ascii operator console markdown status while data driven expected remediation heals an incoherent fixture
// actor: taxonomy_heal_run_test
// role: validator
// source_truth: implementation

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { runObservableTaxonomyHeal } = require("../bin/taxonomy-heal-run");

// warehouse:method
// responsibility: Verifies observable taxonomy healing run updates contract driven ascii operator console markdown status while data driven expected remediation heals an incoherent fixture
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
  } finally {
    fs.rmSync(reportsDir, { recursive: true, force: true });
    fs.rmSync(fixturePath, { force: true });
  }
}

// warehouse:method
// responsibility: Verifies observable taxonomy healing run updates contract driven ascii operator console markdown status while data driven expected remediation heals an incoherent fixture
// actor: method_implementation
// role: implementation
// source_truth: implementation
function runTaxonomyHealRunVerification() {
  verifyObservableHealingRun();
  console.log("Taxonomy heal run verification passed.");
  return 0;
}

if (require.main === module) {
  process.exit(runTaxonomyHealRunVerification());
}

module.exports = { verifyObservableHealingRun, runTaxonomyHealRunVerification };
