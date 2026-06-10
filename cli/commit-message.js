#!/usr/bin/env node
// warehouse:file
// responsibility: Generates a commit message from staged changes and writes the supporting taxonomy report
// actor: commit_message_cli
// role: command_entrypoint
// source_truth: implementation

const fs = require("fs");
const path = require("path");
const { buildChangeTaxonomy } = require("../src/worker-bee/commit-message/change-taxonomy");
const { generateCommitMessage, writeCommitMessageReport } = require("../src/worker-bee/commit-message/generator");

function parseArgs(argv) {
  const args = {
    repoRoot: path.resolve(__dirname, ".."),
    reportsDir: null,
    json: false,
    messageOnly: false,
    write: null,
    maxFiles: undefined,
    maxExcerptLines: undefined,
    help: false,
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
      case "--json":
        args.json = true;
        break;
      case "--message-only":
        args.messageOnly = true;
        break;
      case "--write":
        args.write = path.resolve(argv[++i]);
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
  console.log("Usage: node cli/commit-message.js [--repo-root <path>] [--reports-dir <path>] [--json] [--message-only] [--write <file>] [--max-files <n>] [--max-excerpt-lines <n>]");
  console.log("");
  console.log("Generates a commit message from the staged diff taxonomy using Gemini Flash Worker B.");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return 0;
  }

  const repoRoot = args.repoRoot;
  const reportsDir = args.reportsDir || path.join(repoRoot, "reports");
  if (!fs.existsSync(repoRoot)) {
    throw new Error(`Repo root does not exist: ${repoRoot}`);
  }

  const taxonomy = buildChangeTaxonomy(repoRoot, { maxFiles: args.maxFiles, maxExcerptLines: args.maxExcerptLines });
  if (!taxonomy.files.length) {
    console.error("No staged changes found. Stage changes first with 'git add' or rerun after staging.");
    return 1;
  }

  const result = await generateCommitMessage(taxonomy, {
    apiKey: process.env.LOC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  });
  const reportPaths = writeCommitMessageReport(reportsDir, taxonomy, result);

  if (args.write) {
    fs.writeFileSync(args.write, result.message + "\n", "utf8");
  }

  const shouldPrintDetails = !args.messageOnly && process.stdout.isTTY;

  if (args.json) {
    console.log(JSON.stringify({ ...result, ...reportPaths }, null, 2));
  } else if (shouldPrintDetails) {
    console.log(result.message);
    console.log(`\nTaxonomy: ${reportPaths.taxonomyPath}`);
    console.log(`Report:   ${reportPaths.reportPath}`);
    console.log(`Message:   ${reportPaths.messagePath}`);
    if (result.confidence) {
      console.log(`Confidence: ${result.confidence}`);
    }
  } else {
    console.log(result.message);
  }

  return 0;
}

if (require.main === module) {
  main()
    .then((code) => process.exit(code))
    .catch((error) => {
      console.error(`commit-message failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { main, parseArgs, printHelp };
