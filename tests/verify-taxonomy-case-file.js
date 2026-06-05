#!/usr/bin/env node
// warehouse:file
// responsibility: Verifies taxonomy case file workflow scans incoherent code deduplicates subsumed responsibilities and produces actual evidence diagnosis expected taxonomy and remediation artifacts
// actor: taxonomy_case_test
// role: validator
// source_truth: implementation

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const {
  buildTaxonomyCaseFile,
  collapseRepeatedResponsibility,
  removeSubsumedResponsibilities,
} = require("../cli/taxonomy-case-file");

// warehouse:method
// responsibility: Verifies taxonomy case file workflow scans incoherent code deduplicates subsumed responsibilities and produces actual evidence diagnosis expected taxonomy and remediation artifacts
// actor: method_implementation
// role: implementation
// source_truth: implementation
function verifySubsumedResponsibilitiesCollapse() {
  const concise = "Renders contract driven observability ascii components including reusable progress bars";
  const richer = "Renders contract driven observability ascii components including reusable progress bars status icons with named console styles fallback modes and pending state handling";
  assert.deepStrictEqual(
    removeSubsumedResponsibilities([concise, richer]),
    [richer],
    "expected taxonomy should keep richer responsibility and drop subsumed fragment"
  );
  assert.strictEqual(
    collapseRepeatedResponsibility(`${concise} and ${richer}`),
    richer,
    "single responsibility text should collapse subsumed joined fragments"
  );
}

// warehouse:method
// responsibility: Verifies taxonomy case file workflow scans incoherent code deduplicates subsumed responsibilities and produces actual evidence diagnosis expected taxonomy and remediation artifacts
// actor: method_implementation
// role: implementation
// source_truth: implementation
function verifyIncoherentFileCaseArtifacts() {
  const root = path.resolve(__dirname, "..");
  const outputRoot = path.join(root, ".tmp", "taxonomy-case-files");
  const fixtureDir = path.join(root, ".tmp");
  const fixturePath = path.join(fixtureDir, "incoherent-case.fixture.js");
  const fixtureRelPath = path.relative(root, fixturePath).replace(/\\/g, "/");
  fs.mkdirSync(fixtureDir, { recursive: true });
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
      "// responsibility: Parses worker-bee log for packet completion events and Parses worker-bee log for packet completion events",
      "// actor: method_implementation",
      "// role: implementation",
      "// source_truth: implementation",
      "function readProgress() {",
      "  return 1;",
      "}",
      "",
      "// warehouse:method",
      "// responsibility: Formats elapsed milliseconds into a duration string for stall detection and Formats elapsed milliseconds into a duration string for stall detection",
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

  fs.rmSync(outputRoot, { recursive: true, force: true });

  const result = buildTaxonomyCaseFile(fixtureRelPath, root, outputRoot);
  const caseDir = path.join(root, result.case_dir);
  const actual = JSON.parse(fs.readFileSync(path.join(caseDir, "actual-taxonomy.json"), "utf8"));
  const evidence = JSON.parse(fs.readFileSync(path.join(caseDir, "evidence.json"), "utf8"));
  const expected = JSON.parse(fs.readFileSync(path.join(caseDir, "expected-coherence.json"), "utf8"));
  const report = fs.readFileSync(path.join(caseDir, "incoherence-report.md"), "utf8");

  assert.ok(result.current_score < 100, "fixture should prove an incoherent starting point");
  assert.strictEqual(actual.path, fixtureRelPath, "actual taxonomy should identify scanned file");
  assert.strictEqual(evidence.coverage.function_coverage, 100, "scanner should cover every detected function");
  assert.strictEqual(evidence.coverage.documented_coverage, 100, "existing functions should be documented");
  assert.strictEqual(evidence.trustworthy, false, "incoherent fixture evidence should not be trustworthy");
  assert.strictEqual(expected.target_score, 100, "expected remediation should target perfect coherence");
  assert.strictEqual(expected.required_changes[0].type, "anchor_update", "case should identify anchor update remediation");
  assert.strictEqual(expected.required_refactorings.length, 0, "case should not invent refactoring when anchor repair is sufficient");
  assert.ok(report.includes(`Current coherence: ${result.current_score}/100`), "report should include current score");
  assert.ok(report.includes("Required Changes"), "report should include remediation section");

  fs.rmSync(outputRoot, { recursive: true, force: true });
  fs.rmSync(fixturePath, { force: true });
}

// warehouse:method
// responsibility: Verifies taxonomy case file workflow scans incoherent code deduplicates subsumed responsibilities and produces actual evidence diagnosis expected taxonomy and remediation artifacts
// actor: method_implementation
// role: implementation
// source_truth: implementation
function runTaxonomyCaseFileVerification() {
  verifySubsumedResponsibilitiesCollapse();
  verifyIncoherentFileCaseArtifacts();
  console.log("Taxonomy case file verification passed.");
  return 0;
}

if (require.main === module) {
  process.exit(runTaxonomyCaseFileVerification());
}

module.exports = {
  verifySubsumedResponsibilitiesCollapse,
  verifyIncoherentFileCaseArtifacts,
  runTaxonomyCaseFileVerification,
};
