// warehouse:file
// responsibility: Stages changes, generates a taxonomy-backed commit message, commits, and optionally pushes
// actor: worker_bee_infrastructure
// role: commit_orchestrator
// source_truth: implementation

const { execFileSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const { buildChangeTaxonomy } = require("./change-taxonomy");
const { generateCommitMessage, writeCommitMessageReport } = require("./generator");

function runGit(repoRoot, args, options = {}) {
  return execFileSync("git", ["-c", "core.quotePath=false", ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
}

function stageAllChanges(repoRoot) {
  runGit(repoRoot, ["add", "-A"]);
}

function getCurrentBranch(repoRoot) {
  const branch = runGit(repoRoot, ["branch", "--show-current"]).trim();
  return branch || null;
}

function commitChanges(repoRoot, message) {
  runGit(repoRoot, ["commit", "-m", message]);
}

function pushCommit(repoRoot, options = {}) {
  const remote = options.remote || "origin";
  const branch = options.branch || getCurrentBranch(repoRoot);
  if (!branch) {
    throw new Error("Cannot push from a detached HEAD without --branch");
  }
  if (options.branch) {
    runGit(repoRoot, ["push", "-u", remote, `HEAD:refs/heads/${branch}`]);
  } else {
    runGit(repoRoot, ["push", "-u", remote, branch]);
  }
  return { remote, branch };
}

async function runCommitAndPush(repoRoot, options = {}) {
  const reportsDir = options.reportsDir || path.join(repoRoot, "reports");
  const remote = options.remote || "origin";
  const branch = options.branch || null;
  const doPush = options.push !== false;

  stageAllChanges(repoRoot);
  const taxonomy = buildChangeTaxonomy(repoRoot, {
    maxFiles: options.maxFiles,
    maxExcerptLines: options.maxExcerptLines,
  });

  if (!taxonomy.files.length) {
    return {
      status: "empty",
      message: "No changes found after staging.",
      pushed: false,
      reportPaths: null,
    };
  }

  const result = await generateCommitMessage(taxonomy, {
    apiKey: options.apiKey,
    model: options.model,
  });
  const reportPaths = writeCommitMessageReport(reportsDir, taxonomy, result);
  commitChanges(repoRoot, result.message);

  let pushResult = null;
  if (doPush) {
    pushResult = pushCommit(repoRoot, { remote, branch });
  }

  return {
    status: "ok",
    message: result.message,
    taxonomy,
    result,
    reportPaths,
    pushed: Boolean(pushResult),
    pushResult,
  };
}

module.exports = {
  commitChanges,
  getCurrentBranch,
  pushCommit,
  runCommitAndPush,
  stageAllChanges,
  runGit,
};
