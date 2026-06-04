#!/usr/bin/env node
// warehouse:file
// responsibility: Verifies expected taxonomy JSON data drives anchor remediation worker preserves script shebang and heals incoherent fixture to accepted coherent evidence
// actor: taxonomy_heal_test
// role: validator
// source_truth: implementation

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { buildTaxonomyCaseFile } = require("../bin/taxonomy-case-file");
const { applyExpectedTaxonomy } = require("../bin/taxonomy-heal");
const { buildFileEvidence } = require("../bin/taxonomy-evidence-bundle");

// warehouse:method
// responsibility: Verifies expected taxonomy JSON data drives anchor remediation worker preserves script shebang and heals incoherent fixture to accepted coherent evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function verifyExpectedTaxonomyDrivesHealing() {
  const root = path.resolve(__dirname, "..");
  const fixtureDir = path.join(root, ".tmp");
  const outputRoot = path.join(root, ".tmp", "taxonomy-heal-case");
  const fixturePath = path.join(fixtureDir, "taxonomy-heal.fixture.js");
  const fixtureRelPath = path.relative(root, fixturePath).replace(/\\/g, "/");

  fs.mkdirSync(fixtureDir, { recursive: true });
  fs.rmSync(outputRoot, { recursive: true, force: true });
  fs.writeFileSync(
    fixturePath,
    [
      "#!/usr/bin/env node",
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
    const before = buildTaxonomyCaseFile(fixtureRelPath, root, outputRoot);
    assert.ok(before.current_score < 100, "fixture should start incoherent");
    const expectedPath = path.join(root, before.case_dir, "expected-coherence.json");
    const result = applyExpectedTaxonomy(expectedPath, root);
    const evidence = buildFileEvidence(fixtureRelPath, root);
    const healedContent = fs.readFileSync(fixturePath, "utf8");

    assert.strictEqual(result.accepted, true, "healer should satisfy expected target score");
    assert.strictEqual(result.score, 100, "healed fixture should reach 100/100 coherence");
    assert.strictEqual(evidence.trustworthy, true, "healed fixture evidence should be trustworthy");
    assert.ok(healedContent.startsWith("#!/usr/bin/env node\n"), "healer should preserve script shebang");
  } finally {
    fs.rmSync(outputRoot, { recursive: true, force: true });
    fs.rmSync(fixturePath, { force: true });
  }
}

// warehouse:method
// responsibility: Verifies expected taxonomy JSON data drives anchor remediation worker preserves script shebang and heals incoherent fixture to accepted coherent evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function runTaxonomyHealVerification() {
  verifyExpectedTaxonomyDrivesHealing();
  console.log("Taxonomy heal verification passed.");
  return 0;
}

if (require.main === module) {
  process.exit(runTaxonomyHealVerification());
}

module.exports = { verifyExpectedTaxonomyDrivesHealing, runTaxonomyHealVerification };
