// warehouse:file
// responsibility: Verifies the one-shot commit-and-push flow stages changes, commits with a generated message, and pushes to a remote
// actor: commit_and_push_test
// role: verification
// source_truth: implementation

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

function runGit(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8" });
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

function createFixtureRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "commit-and-push-"));
  const remote = fs.mkdtempSync(path.join(os.tmpdir(), "commit-and-push-remote-"));
  const reports = fs.mkdtempSync(path.join(os.tmpdir(), "commit-and-push-reports-"));

  runGit(remote, ["init", "--bare"]);
  runGit(root, ["init"]);
  runGit(root, ["checkout", "-b", "main"]);
  runGit(root, ["config", "user.email", "test@example.com"]);
  runGit(root, ["config", "user.name", "Test User"]);
  runGit(root, ["remote", "add", "origin", remote]);

  writeFile(path.join(root, "cli", "sample.js"), "console.log('baseline');\n");
  runGit(root, ["add", "."]);
  runGit(root, ["commit", "-m", "baseline"]);

  writeFile(path.join(root, "cli", "sample.js"), "console.log('updated');\nconst answer = 42;\n");
  writeFile(path.join(root, "docs", "notes.md"), "# Notes\n\n- updated docs\n");

  return { root, remote, reports };
}

function run() {
  const { root, remote, reports } = createFixtureRepo();
  const cliPath = path.resolve(__dirname, "..", "cli", "commit-and-push.js");
  const stdout = execFileSync(
    process.execPath,
    [cliPath, "--repo-root", root, "--reports-dir", reports, "--remote", "origin", "--branch", "main"],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        LOC_GEMINI_API_KEY: "",
        GEMINI_API_KEY: "",
        GOOGLE_API_KEY: "",
      },
    }
  );

  const headMessage = runGit(root, ["log", "-1", "--format=%s"]).trim();
  const remoteHead = runGit(remote, ["rev-parse", "refs/heads/main"]).trim();
  const localHead = runGit(root, ["rev-parse", "HEAD"]).trim();
  const status = runGit(root, ["status", "--short"]).trim();

  assert.strictEqual(localHead, remoteHead, "remote HEAD should match local HEAD after push");
  assert.strictEqual(status, "", "working tree should be clean after commit-and-push");
  assert.match(headMessage, /^(feat|fix|docs|refactor|test|chore|build|ci|perf|revert)(\([a-z0-9._/-]+\))?: [a-z0-9][a-z0-9 ._-]*$/);
  assert.ok(stdout.includes(headMessage), "CLI output should include the generated commit message");

  console.log("Commit-and-push verification passed.");
}

if (require.main === module) {
  run();
}

module.exports = { createFixtureRepo, run };
