// warehouse:file
// responsibility: Verify package taxonomy census extraction is deterministic, BOM-safe, anchor-aware, and drift-checkable
// actor: delivery_test_author
// role: verifier
// source_truth: taxonomy/loc-delivery-chain.json

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  buildPackageTaxonomyCensus,
  checkPackageTaxonomyCensusReports,
  parseJsonBomSafe,
  writePackageTaxonomyCensusReports,
} = require("../src/observability/package-taxonomy-census");

// warehouse:method
// responsibility: Write a package taxonomy census fixture file and create parent directories
function writeFixture(root, rel, text) {
  const abs = path.join(root, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, text, "utf8");
}

// warehouse:method
// responsibility: Create a temporary package root with BOM package metadata and anchored Python files
function createFixturePackages() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "package-taxonomy-census-"));
  writeFixture(root, "alpha-sdk/package.json", `\uFEFF${JSON.stringify({
    name: "alpha-sdk",
    description: "SDK package for projected workspaces",
    private: true,
    keywords: ["sdk", "projection"],
    scripts: { check: "node test.js" },
    wpi: {
      candidate_key: "alpha",
      package_family: "SDK",
      posture: "generated boundary",
      promotion_readiness: "promotable_with_review",
      integrity_score: 95,
    },
  }, null, 2)}`);
  writeFixture(root, "alpha-sdk/src/client.py", [
    "# warehouse:file",
    "# actor: infrastructure_services",
    "# role: sdk_surface",
    "# responsibility: Provides alpha SDK projection reads.",
    "# source_truth: contract_backed_projection",
    "",
    "class AlphaClient:",
    "    # warehouse:method",
    "    # responsibility: Read projected workspace status.",
    "    def read_status(self):",
    "        return 'ok'",
    "",
  ].join("\n"));
  writeFixture(root, "alpha-sdk/README.md", "Evidence: docs/live-operational-cognition/value-proofs/example-operational-value-proof.md\n");
  writeFixture(root, "alpha-sdk/MANIFEST.md", "Posture: generated boundary\n");
  writeFixture(root, "alpha-sdk/contracts/alpha.json", "{}\n");

  writeFixture(root, "beta-internal/src/store.py", [
    "# warehouse:file",
    "# actor: infrastructure_services",
    "# role: data_access",
    "# responsibility: Stores beta internal records.",
    "# source_truth: sql_backed",
    "",
    "# warehouse:method",
    "# responsibility: Insert beta records.",
    "def insert_beta():",
    "    return True",
    "",
  ].join("\n"));
  return root;
}

// warehouse:method
// responsibility: Prove BOM-safe JSON parsing handles package metadata with a byte order mark
function verifyBomSafeJson() {
  const parsed = parseJsonBomSafe("\uFEFF{\"ok\":true}", "fixture");
  assert.strictEqual(parsed.error, null);
  assert.strictEqual(parsed.value.ok, true);
}

// warehouse:method
// responsibility: Prove census extraction captures anchors, optional missing files, and deterministic summary counts
function verifyCensusExtraction() {
  const packagesRoot = createFixturePackages();
  const first = buildPackageTaxonomyCensus(packagesRoot);
  const second = buildPackageTaxonomyCensus(packagesRoot);
  assert.deepStrictEqual(first, second, "census must be deterministic");
  assert.strictEqual(first.summary.package_count, 2);
  assert.strictEqual(first.summary.package_json_count, 1);
  assert.strictEqual(first.summary.package_json_parse_error_count, 0);
  assert.strictEqual(first.summary.python_file_count, 2);
  assert.strictEqual(first.summary.python_full_file_anchor_count, 2);
  assert.strictEqual(first.summary.python_method_anchor_count, 2);
  assert.strictEqual(first.summary.contracts_count, 1);
  assert.ok(first.packages.find((row) => row.folder_name === "beta-internal"), "missing package.json package should still be recorded");
}

// warehouse:method
// responsibility: Prove report writing and check mode detect current and drifted package taxonomy census artifacts
function verifyReportWritingAndDriftCheck() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "package-taxonomy-census-reports-"));
  const packagesRoot = createFixturePackages();
  const census = buildPackageTaxonomyCensus(packagesRoot);
  writePackageTaxonomyCensusReports(repoRoot, census);
  assert.ok(fs.existsSync(path.join(repoRoot, "reports/package-taxonomy-census/latest.json")));
  assert.ok(fs.existsSync(path.join(repoRoot, "reports/package-taxonomy-census/worker-input.json")));
  assert.ok(fs.existsSync(path.join(repoRoot, "reports/PACKAGE-TAXONOMY-CENSUS-LATEST.md")));
  assert.strictEqual(checkPackageTaxonomyCensusReports(repoRoot, census).ok, true);
  fs.writeFileSync(path.join(repoRoot, "reports/package-taxonomy-census/latest.json"), "{}\n", "utf8");
  const drift = checkPackageTaxonomyCensusReports(repoRoot, census);
  assert.strictEqual(drift.ok, false);
  assert.ok(drift.drift.some((entry) => entry.reason === "drift"));
}

verifyBomSafeJson();
verifyCensusExtraction();
verifyReportWritingAndDriftCheck();
console.log("Package taxonomy census verification passed.");
