// warehouse:file
// responsibility: Verify retirement preflight blocks active references and only passes with complete retirement evidence
// actor: delivery_test_author
// role: verifier
// source_truth: taxonomy/loc-delivery-chain.json

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  buildRetirementPreflight,
  formatRetirementPreflightMarkdown,
  writeRetirementPreflightReport,
} = require("../src/observability/retirement-preflight");

// warehouse:method
// responsibility: Write a fixture file inside the temporary preflight repository
function writeFixture(root, rel, text) {
  const abs = path.join(root, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, text, "utf8");
}

// warehouse:method
// responsibility: Create a temporary repository with package, caller, test, doc, and projection references
function createReferencedRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "retirement-preflight-"));
  writeFixture(root, "package.json", JSON.stringify({
    scripts: { active: "node cli/active.js" },
    bin: { active: "cli/active.js" },
  }, null, 2));
  writeFixture(root, "cli/active.js", "module.exports = function active() { return true; };\n");
  writeFixture(root, "src/consumer.js", "const active = require('../cli/active');\nactive();\n");
  writeFixture(root, "tests/active.test.js", "const target = 'cli/active.js';\n");
  writeFixture(root, "docs/active.md", "Candidate: cli/active.js\n");
  writeFixture(root, "reports/projection.json", "{\"path\":\"cli/active.js\"}\n");
  return root;
}

// warehouse:method
// responsibility: Create a temporary repository with complete retirement evidence and no active references
function createSafeRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "retirement-preflight-safe-"));
  writeFixture(root, "package.json", JSON.stringify({ scripts: {}, bin: {} }, null, 2));
  writeFixture(root, "src/unused.js", "module.exports = 1;\n");
  writeFixture(root, "reports/loc-delivery-taxonomy/latest/retirement-evidence.json", JSON.stringify({
    schema: "loc-delivery-retirement-evidence.v1",
    candidates: [{
      path: "src/unused.js",
      caller_scan: "pass",
      export_scan: "pass",
      script_reference_scan: "pass",
      test_reference_scan: "pass",
      doc_reference_scan: "pass",
      runtime_use_scan: "pass",
      generated_projection_scan: "pass",
      safe_to_remove: true,
    }],
  }, null, 2));
  return root;
}

// warehouse:method
// responsibility: Prove active references block retirement and keep safe_to_remove false
function verifyReferencedCandidateBlocks() {
  const root = createReferencedRepo();
  const report = buildRetirementPreflight(root, ["cli/active.js"]);
  const candidate = report.candidates[0];
  assert.strictEqual(report.status, "blocked");
  assert.strictEqual(candidate.safe_to_remove, false);
  assert.strictEqual(candidate.scans.caller_scan.status, "blocked");
  assert.strictEqual(candidate.scans.script_reference_scan.status, "blocked");
  assert.strictEqual(candidate.scans.export_scan.status, "blocked");
  assert.strictEqual(candidate.scans.test_reference_scan.status, "blocked");
  assert.strictEqual(candidate.scans.doc_reference_scan.status, "blocked");
  assert.strictEqual(candidate.scans.generated_projection_scan.status, "blocked");
  assert.strictEqual(candidate.scans.retirement_evidence_scan.status, "blocked");
}

// warehouse:method
// responsibility: Prove candidates only pass when all references are clear and evidence marks safe_to_remove true
function verifyCompleteEvidenceCanPass() {
  const root = createSafeRepo();
  const report = buildRetirementPreflight(root, ["src/unused.js"]);
  const candidate = report.candidates[0];
  assert.strictEqual(report.status, "pass");
  assert.strictEqual(candidate.safe_to_remove, true);
  assert.strictEqual(candidate.scans.retirement_evidence_scan.status, "pass");
}

// warehouse:method
// responsibility: Prove retirement preflight writes visible latest JSON and markdown reports
function verifyVisibleReports() {
  const root = createReferencedRepo();
  const report = buildRetirementPreflight(root, ["cli/active.js"]);
  const markdown = formatRetirementPreflightMarkdown(report);
  assert.ok(markdown.includes("# Retirement Preflight"), "markdown title should be visible");
  assert.ok(markdown.includes("Retirement is blocked"), "markdown should explain the decision");

  const artifacts = writeRetirementPreflightReport(root, report);
  assert.ok(fs.existsSync(artifacts.latestJsonPath), "latest JSON report should exist");
  assert.ok(fs.existsSync(artifacts.latestMdPath), "latest markdown report should exist");
  assert.ok(fs.existsSync(artifacts.rootLatestMdPath), "root latest markdown report should exist");
  const saved = JSON.parse(fs.readFileSync(artifacts.latestJsonPath, "utf8"));
  assert.strictEqual(saved.status, "blocked");
}

verifyReferencedCandidateBlocks();
verifyCompleteEvidenceCanPass();
verifyVisibleReports();
console.log("Retirement preflight verification passed.");
