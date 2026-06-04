// warehouse:file
// responsibility: Verifies loc story coherence package exposes read only SDK APIs and CLI commands for scan review packets checks README and residue verdicts
// actor: story_coherence_package_test
// role: verification
// source_truth: implementation

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  buildCodebaseStoryReview,
  buildStoryReasoningPacket,
  checkCodebaseStory,
  explainStoryPath,
  generateReadmeProjection,
  getGovernanceVerdict,
  scanTaxonomy,
  writeStoryReasoningPacket,
} = require("../packages/story-coherence/src");
const { runLocStory } = require("../packages/story-coherence/bin/loc-story");

// warehouse:method
// responsibility: Verifies loc story coherence package exposes read only SDK APIs and CLI commands for scan review packets checks README and residue verdicts
// actor: method_implementation
// role: implementation
// source_truth: implementation
function makeFixtureRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "loc-story-package-"));
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
// responsibility: Verifies loc story coherence package exposes read only SDK APIs and CLI commands for scan review packets checks README and residue verdicts
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
  const packet = buildStoryReasoningPacket({ rootDir: root });
  assert.strictEqual(packet.schema, "story-coherence-reasoning-packet.v1");
  assert.strictEqual(packet.status, "story_coherence_earned");
  assert.strictEqual(packet.localTieOut.score, 100);
  assert.strictEqual(packet.filesystemStory.status, "pass");
  assert.strictEqual(packet.readmeAlignment.status, "pass");
  assert.deepStrictEqual(packet.openQuestions, []);
  assert.match(packet.authorityBoundary.ai, /advisory/);
  const written = writeStoryReasoningPacket({ rootDir: root });
  assert(fs.existsSync(written.outPath));
  const check = checkCodebaseStory({ rootDir: root });
  assert.strictEqual(check.status, "story_coherence_earned");
  assert.strictEqual(check.exitCode, 0);
  assert.strictEqual(check.gates.readmeAlignment, "pass");
  const explanation = explainStoryPath({ rootDir: root, targetPath: "bin" });
  assert.strictEqual(explanation.schema, "story-coherence-path-explanation.v1");
  assert.match(explanation.role, /CLI/);
}

// warehouse:method
// responsibility: Verifies loc story coherence package exposes read only SDK APIs and CLI commands for scan review packets checks README and residue verdicts
// actor: method_implementation
// role: implementation
// source_truth: implementation
function verifyCliFlow() {
  const root = makeFixtureRepo();
  const originalLog = console.log;
  const originalError = console.error;
  console.log = () => {};
  console.error = () => {};
  try {
    assert.strictEqual(runLocStory(["scan", ".", "--root", root, "--write"]), 0);
    assert.strictEqual(runLocStory(["review", "--root", root, "--write"]), 0);
    assert.strictEqual(runLocStory(["readme", ".", "--root", root, "--out", "README.md"]), 0);
    assert.strictEqual(runLocStory(["packet", "--root", root, "--for-ai", "--write"]), 0);
    assert.strictEqual(runLocStory(["check", "--root", root]), 0);
    assert.strictEqual(runLocStory(["explain", "bin", "--root", root]), 0);
    assert.strictEqual(runLocStory(["residue", "--root", root]), 0);
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }
  assert(fs.existsSync(path.join(root, "README.md")));
  assert(fs.existsSync(path.join(root, "reports", "story-coherence", "latest", "ai-packet.json")));
}

verifySdkFlow();
verifyCliFlow();
console.log("@loc/story-coherence package verification passed.");
