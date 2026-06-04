#!/usr/bin/env node
// warehouse:file
// responsibility: Verifies taxonomy case file workflow scans incoherent code produces actual evidence diagnosis expected taxonomy and remediation artifacts
// actor: taxonomy_case_test
// role: validator
// source_truth: implementation

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { buildTaxonomyCaseFile } = require("../bin/taxonomy-case-file");

// warehouse:method
// responsibility: Verifies taxonomy case file workflow scans incoherent code produces actual evidence diagnosis expected taxonomy and remediation artifacts
// actor: method_implementation
// role: implementation
// source_truth: implementation
function verifyIncoherentFileCaseArtifacts() {
  const root = path.resolve(__dirname, "..");
  const outputRoot = path.join(root, ".tmp", "taxonomy-case-files");
  fs.rmSync(outputRoot, { recursive: true, force: true });

  const result = buildTaxonomyCaseFile("bin/track-progress.js", root, outputRoot);
  const caseDir = path.join(root, result.case_dir);
  const actual = JSON.parse(fs.readFileSync(path.join(caseDir, "actual-taxonomy.json"), "utf8"));
  const evidence = JSON.parse(fs.readFileSync(path.join(caseDir, "evidence.json"), "utf8"));
  const expected = JSON.parse(fs.readFileSync(path.join(caseDir, "expected-coherence.json"), "utf8"));
  const report = fs.readFileSync(path.join(caseDir, "incoherence-report.md"), "utf8");

  assert.strictEqual(result.current_score, 0, "track-progress should prove the incoherent starting point");
  assert.strictEqual(actual.path, "bin/track-progress.js", "actual taxonomy should identify scanned file");
  assert.strictEqual(evidence.coverage.function_coverage, 100, "scanner should cover every detected function");
  assert.strictEqual(evidence.coverage.documented_coverage, 100, "existing functions should be documented");
  assert.strictEqual(expected.target_score, 100, "expected remediation should target perfect coherence");
  assert.strictEqual(expected.required_changes[0].type, "anchor_update", "case should identify anchor update remediation");
  assert.strictEqual(expected.required_refactorings.length, 0, "case should not invent refactoring when anchor repair is sufficient");
  assert.ok(report.includes("Current coherence: 0/100"), "report should include current score");
  assert.ok(report.includes("Required Changes"), "report should include remediation section");

  fs.rmSync(outputRoot, { recursive: true, force: true });
}

// warehouse:method
// responsibility: Verifies taxonomy case file workflow scans incoherent code produces actual evidence diagnosis expected taxonomy and remediation artifacts
// actor: method_implementation
// role: implementation
// source_truth: implementation
function runTaxonomyCaseFileVerification() {
  verifyIncoherentFileCaseArtifacts();
  console.log("Taxonomy case file verification passed.");
  return 0;
}

if (require.main === module) {
  process.exit(runTaxonomyCaseFileVerification());
}

module.exports = { verifyIncoherentFileCaseArtifacts, runTaxonomyCaseFileVerification };
