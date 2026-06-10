// warehouse:file
// responsibility: Verifies staged git diffs build a commit-message taxonomy and format into a conventional commit
// actor: commit_message_test
// role: verification
// source_truth: implementation

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { buildChangeTaxonomy } = require("../src/worker-bee/commit-message/change-taxonomy");
const { fallbackCommitMessage, formatCommitMessage } = require("../src/worker-bee/commit-message/generator");

function runGit(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8" });
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

function createFixtureRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "commit-msg-taxonomy-"));
  runGit(root, ["init"]);
  runGit(root, ["config", "user.email", "test@example.com"]);
  runGit(root, ["config", "user.name", "Test User"]);
  writeFile(path.join(root, "cli", "sample.js"), "console.log('baseline');\n");
  runGit(root, ["add", "."]);
  runGit(root, ["commit", "-m", "baseline"]);

  writeFile(path.join(root, "cli", "sample.js"), "console.log('updated');\nconst answer = 42;\n");
  writeFile(path.join(root, "docs", "notes.md"), "# Notes\n\n- updated docs\n");
  runGit(root, ["add", "."]);
  return root;
}

function run() {
  const root = createFixtureRepo();
  const taxonomy = buildChangeTaxonomy(root, { maxFiles: 10, maxExcerptLines: 10 });

  assert.strictEqual(taxonomy.schema, "commit-message-taxonomy.v1");
  assert.strictEqual(taxonomy.files.length, 2);
  assert.strictEqual(taxonomy.summary.total_files, 2);
  assert.strictEqual(taxonomy.summary.surface.cli, 1);
  assert.strictEqual(taxonomy.summary.surface.docs, 1);

  const cliFile = taxonomy.files.find((file) => file.path === "cli/sample.js");
  const docsFile = taxonomy.files.find((file) => file.path === "docs/notes.md");
  assert.ok(cliFile, "expected cli/sample.js in taxonomy");
  assert.ok(docsFile, "expected docs/notes.md in taxonomy");
  assert.strictEqual(cliFile.surface, "cli");
  assert.strictEqual(cliFile.kind, "javascript");
  assert.strictEqual(cliFile.role, "implementation");
  assert.strictEqual(docsFile.surface, "docs");
  assert.strictEqual(docsFile.role, "documentation");

  const formatted = formatCommitMessage(
    { type: "Feat", scope: "Worker Bee", subject: "Add commit message taxonomy.", confidence: "high" },
    taxonomy
  );
  assert.strictEqual(formatted.message, "feat(worker-bee): add commit message taxonomy");

  const fallback = fallbackCommitMessage(taxonomy);
  assert.ok(["feat", "docs", "test", "chore"].includes(fallback.type));

  console.log("Commit-message taxonomy verification passed.");
}

if (require.main === module) {
  run();
}

module.exports = { createFixtureRepo, run };
