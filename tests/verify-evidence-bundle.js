#!/usr/bin/env node
// warehouse:file
// responsibility: Verifies taxonomy evidence bundle ties detected functions to extracted anchors coverage coherence and red signal failure cases for trusted scanner files
// actor: evidence_test
// role: validator
// source_truth: implementation

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { buildFileEvidence } = require("../bin/taxonomy-evidence-bundle");

// warehouse:method
// responsibility: Verifies taxonomy evidence bundle ties detected functions to extracted anchors coverage coherence and red signal failure cases for trusted scanner files
// actor: method_implementation
// role: implementation
// source_truth: implementation
function verifyFractalScannerEvidence() {
  const root = path.resolve(__dirname, "..");
  const evidence = buildFileEvidence("bin/fractal-taxonomy-scanner.js", root);

  assert.strictEqual(evidence.coverage.detected_function_count, 5, "fractal scanner should expose five functions");
  assert.strictEqual(evidence.coverage.taxonomy_method_count, 5, "taxonomy should include every detected function");
  assert.strictEqual(evidence.coverage.documented_method_count, 5, "every detected function should have method taxonomy");
  assert.strictEqual(evidence.coverage.function_coverage, 100, "function coverage should be 100%");
  assert.strictEqual(evidence.coverage.documented_coverage, 100, "documented method coverage should be 100%");
  assert.deepStrictEqual(evidence.coverage.missing_from_taxonomy, [], "no function should be missing from taxonomy");
  assert.deepStrictEqual(evidence.coverage.undocumented, [], "no function should be undocumented");
  assert.deepStrictEqual(evidence.coverage.unexpected_taxonomy, [], "taxonomy should not contain unexpected methods");
  assert.strictEqual(evidence.coherence.score, 100, "fractal scanner coherence should be 100/100");
  assert.strictEqual(evidence.trustworthy, true, "fractal scanner evidence should be trustworthy");
}

// warehouse:method
// responsibility: Verifies taxonomy evidence bundle ties detected functions to extracted anchors coverage coherence and red signal failure cases for trusted scanner files
// actor: method_implementation
// role: implementation
// source_truth: implementation
function verifyMissingMethodAnchorFailsEvidence() {
  const root = path.resolve(__dirname, "..");
  const fixtureDir = path.join(root, ".tmp");
  const fixturePath = path.join(fixtureDir, "missing-method-anchor.fixture.js");
  fs.mkdirSync(fixtureDir, { recursive: true });
  fs.writeFileSync(
    fixturePath,
    [
      "// warehouse:file",
      "// responsibility: Demonstrates evidence bundle red signal for missing method taxonomy",
      "// actor: evidence_fixture",
      "// role: validator",
      "// source_truth: test_fixture",
      "",
      "function missingAnchor() {",
      "  return true;",
      "}",
      "",
    ].join("\n"),
    "utf8"
  );

  try {
    const evidence = buildFileEvidence(fixturePath, root);
    assert.strictEqual(evidence.coverage.detected_function_count, 1, "fixture should expose one function");
    assert.strictEqual(evidence.coverage.taxonomy_method_count, 1, "taxonomy extractor should surface the unanchored function");
    assert.strictEqual(evidence.coverage.documented_method_count, 0, "unanchored function should not count as documented");
    assert.strictEqual(evidence.coverage.function_coverage, 100, "function should still be represented in taxonomy evidence");
    assert.strictEqual(evidence.coverage.documented_coverage, 0, "documented coverage should go red");
    assert.deepStrictEqual(
      evidence.coverage.undocumented.map((fn) => fn.name),
      ["missingAnchor"],
      "missing anchor should appear in undocumented evidence"
    );
    assert.strictEqual(evidence.trustworthy, false, "fixture evidence should be untrustworthy");
  } finally {
    fs.rmSync(fixturePath, { force: true });
  }
}

// warehouse:method
// responsibility: Verifies taxonomy evidence bundle ties detected functions to extracted anchors coverage coherence and red signal failure cases for trusted scanner files
// actor: method_implementation
// role: implementation
// source_truth: implementation
function runEvidenceBundleVerification() {
  verifyFractalScannerEvidence();
  verifyMissingMethodAnchorFailsEvidence();
  console.log("Evidence bundle verification passed.");
  return 0;
}

if (require.main === module) {
  process.exit(runEvidenceBundleVerification());
}

module.exports = { verifyFractalScannerEvidence, runEvidenceBundleVerification };
