#!/usr/bin/env node
// warehouse:file
// responsibility: Stages changes, generates a commit message from the staged taxonomy, commits, and pushes
// actor: commit_and_push_cli
// role: command_entrypoint
// source_truth: implementation

const fs = require("fs");
const path = require("path");
const { runCommitAndPush } = require("../src/worker-bee/commit-message/one-shot");

function parseArgs(argv) {
  const args = {
    repoRoot: path.resolve(__dirname, ".."),
    reportsDir: null,
    remote: "origin",
    branch: null,
    push: true,
    json: false,
    help: false,
    maxFiles: undefined,
    maxExcerptLines: undefined,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "--repo-root":
        args.repoRoot = path.resolve(argv[++i]);
        break;
      case "--reports-dir":
        args.reportsDir = path.resolve(argv[++i]);
        break;
      case "--remote":
        args.remote = argv[++i];
        break;
      case "--branch":
        args.branch = argv[++i];
        break;
      case "--no-push":
        args.push = false;
        break;
      case "--json":
        args.json = true;
        break;
      case "--max-files":
        args.maxFiles = Number(argv[++i]);
        break;
      case "--max-excerpt-lines":
        args.maxExcerptLines = Number(argv[++i]);
        break;
      case "--help":
      case "-h":
        args.help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function printHelp() {
  console.log("Usage: node cli/commit-and-push.js [--repo-root <path>] [--reports-dir <path>] [--remote <name>] [--branch <name>] [--no-push] [--json] [--max-files <n>] [--max-excerpt-lines <n>]");
  console.log("");
  console.log("Stages all changes, generates a commit message from the staged taxonomy, commits, and pushes.");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return 0;
  }

  if (!fs.existsSync(args.repoRoot)) {
    throw new Error(`Repo root does not exist: ${args.repoRoot}`);
  }

  const result = await runCommitAndPush(args.repoRoot, {
    reportsDir: args.reportsDir,
    remote: args.remote,
    branch: args.branch,
    push: args.push,
    maxFiles: args.maxFiles,
    maxExcerptLines: args.maxExcerptLines,
    apiKey: process.env.LOC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  });

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    if (result.status === "empty") {
      console.log(result.message);
      return 1;
    }

    console.log(result.message);
    console.log(result.pushed ? `Pushed to ${result.pushResult.remote}/${result.pushResult.branch}` : "Committed locally only");
    console.log(`Taxonomy: ${result.reportPaths.taxonomyPath}`);
    console.log(`Report:   ${result.reportPaths.reportPath}`);
    console.log(`Message:   ${result.reportPaths.messagePath}`);
  }

  return result.status === "empty" ? 1 : 0;
}

if (require.main === module) {
  main()
    .then((code) => process.exit(code))
    .catch((error) => {
      console.error(`commit-and-push failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { main, parseArgs, printHelp };
