// warehouse:file
// responsibility: Verifies loc taxonomy coherence package exposes read only SDK APIs and CLI commands for scan story review README and residue verdicts
// actor: taxonomy_coherence_package_test
// role: verification
// source_truth: implementation

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  buildCodebaseStoryReview,
  generateReadmeProjection,
  getGovernanceVerdict,
  scanTaxonomy,
} = require("../packages/taxonomy-coherence/src");
const { runLocTaxonomy } = require("../packages/taxonomy-coherence/bin/loc-taxonomy");

// warehouse:method
// responsibility: Verifies loc taxonomy coherence package exposes read only SDK APIs and CLI commands for scan story review README and residue verdicts
// actor: method_implementation
// role: implementation
// source_truth: implementation
function makeFixtureRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "loc-taxonomy-package-"));
  fs.mkdirSync(path.join(root, "reports"));
  fs.mkdirSync(path.join(root, "bin"));
  fs.writeFileSync(path.join(root, "bin", "example.js"), [
    "// warehouse:file",
    "// responsibility: Provides example package fixture behavior",
    "// actor: package_fixture",
    "// role: fixture",
    "// source_truth: implementation",
    "",
    "// warehouse:method",
    "// responsibility: Provides example package fixture behavior",
    "// actor: method_implementation",
    "// role: implementation",
    "// source_truth: implementation",
    "function exampleThing() {",
    "  return true;",
    "}",
    "",
    "module.exports = { exampleThing };",
    "",
  ].join("\n"));
  fs.writeFileSync(path.join(root, "bin", "example.py"), [
    "# warehouse:file",
    "# responsibility: Provides Python package fixture behavior",
    "# actor: package_fixture",
    "# role: fixture",
    "# source_truth: implementation",
    "",
    "# warehouse:method",
    "# responsibility: Provides Python package fixture behavior",
    "# actor: method_implementation",
    "# role: implementation",
    "# source_truth: implementation",
    "def example_python_thing():",
    "    return True",
    "",
  ].join("\n"));
  return root;
}

// warehouse:method
// responsibility: Verifies loc taxonomy coherence package exposes read only SDK APIs and CLI commands for scan story review README and residue verdicts
// actor: method_implementation
// role: implementation
// source_truth: implementation
function verifySdkFlow() {
  const root = makeFixtureRepo();
  const scan = scanTaxonomy({ rootDir: root, targetPath: ".", writeReports: true });
  assert.strictEqual(scan.report.summary.files_scanned, 2);
  assert(scan.report.file_ledger.some((row) => row.file === "bin/example.py"));
  assert.strictEqual(scan.report.summary.folder_coherence, 100);
  assert.match(scan.markdown, /TAXONOMY COHERENCE SCAN/);
  const story = buildCodebaseStoryReview({ rootDir: root, writeReports: true });
  assert.strictEqual(story.verdict.overall.earned, true);
  assert.strictEqual(story.verdict.fileEconomy.status, "pass");
  assert.strictEqual(story.verdict.filesystemStory.status, "pass");
  assert.strictEqual(story.verdict.filesystemStory.score, 100);
  assert.strictEqual(story.verdict.readmeAlignment.status, "pass");
  assert.strictEqual(story.verdict.readmeAlignment.staleCount, 0);
  const verdict = getGovernanceVerdict(story.report);
  assert.strictEqual(verdict.status, "story_coherence_earned");
  assert.strictEqual(verdict.filesystemStory.pathLanguageIssues, 0);
  assert.strictEqual(verdict.readmeAlignment.status, "pass");
  const readme = generateReadmeProjection({ rootDir: root, out: "README.md" });
  assert.strictEqual(readme.stale, false);
  assert.match(readme.markdown, /Generated from verified taxonomy and story-review evidence/);
  assert(fs.existsSync(path.join(root, "README.md")));
}

// warehouse:method
// responsibility: Verifies loc taxonomy coherence package exposes read only SDK APIs and CLI commands for scan story review README and residue verdicts
// actor: method_implementation
// role: implementation
// source_truth: implementation
function verifyCliFlow() {
  const root = makeFixtureRepo();
  const originalLog = console.log;
  console.log = () => {};
  try {
    assert.strictEqual(runLocTaxonomy(["scan", ".", "--root", root, "--write"]), 0);
    assert.strictEqual(runLocTaxonomy(["story-review", "--root", root, "--write"]), 0);
    assert.strictEqual(runLocTaxonomy(["readme", ".", "--root", root, "--out", "README.md"]), 0);
    assert.strictEqual(runLocTaxonomy(["residue", "--root", root]), 0);
  } finally {
    console.log = originalLog;
  }
  assert(fs.existsSync(path.join(root, "README.md")));
}

verifySdkFlow();
verifyCliFlow();
console.log("@loc/taxonomy-coherence package verification passed.");
