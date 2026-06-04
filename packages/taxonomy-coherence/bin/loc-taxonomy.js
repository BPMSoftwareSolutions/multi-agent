#!/usr/bin/env node
// warehouse:file
// responsibility: Provides loc taxonomy CLI commands for read only scan story review README projection and residue verdicts
// actor: loc_taxonomy_cli
// role: package_command
// source_truth: implementation

const {
  buildCodebaseStoryReview,
  generateReadmeProjection,
  scanTaxonomy,
} = require("../src/index");

// warehouse:method
// responsibility: Provides loc taxonomy CLI commands for read only scan story review README projection and residue verdicts
// actor: method_implementation
// role: implementation
// source_truth: implementation
function optionValue(args, name, fallback = null) {
  const index = args.indexOf(name);
  if (index === -1 || index === args.length - 1) {
    return fallback;
  }
  return args[index + 1];
}

// warehouse:method
// responsibility: Provides loc taxonomy CLI commands for read only scan story review README projection and residue verdicts
// actor: method_implementation
// role: implementation
// source_truth: implementation
function positionalTarget(args) {
  const value = args.find((arg) => !arg.startsWith("-"));
  return value || ".";
}

// warehouse:method
// responsibility: Provides loc taxonomy CLI commands for read only scan story review README projection and residue verdicts
// actor: method_implementation
// role: implementation
// source_truth: implementation
function printUsage() {
  console.log([
    "Usage: loc-taxonomy <command> [target] [options]",
    "",
    "Commands:",
    "  scan [target]            Run read-only taxonomy scan",
    "  story-review             Build codebase story review from latest scan",
    "  readme [target]          Generate README projection from latest scan/story review",
    "  residue                  Print residue verdict from latest story review",
    "",
    "Options:",
    "  --root <path>            Repository root (default: current directory)",
    "  --reports-dir <path>     Reports directory relative to root (default: reports)",
    "  --out <path>             README output path for readme command",
    "  --write                  Write scan/story report artifacts",
  ].join("\n"));
}

// warehouse:method
// responsibility: Provides loc taxonomy CLI commands for read only scan story review README projection and residue verdicts
// actor: method_implementation
// role: implementation
// source_truth: implementation
function runLocTaxonomy(argv = process.argv.slice(2)) {
  const [command, ...args] = argv;
  const rootDir = optionValue(args, "--root", process.cwd());
  const reportsDir = optionValue(args, "--reports-dir", "reports");
  if (!command || command === "help" || command === "--help") {
    printUsage();
    return 0;
  }
  if (command === "scan") {
    const result = scanTaxonomy({
      rootDir,
      reportsDir,
      targetPath: positionalTarget(args),
      writeReports: args.includes("--write"),
    });
    console.log(JSON.stringify(result.report.summary, null, 2));
    return result.report.summary.folder_coherence === 100 ? 0 : 1;
  }
  if (command === "story-review") {
    const result = buildCodebaseStoryReview({
      rootDir,
      reportsDir,
      writeReports: args.includes("--write"),
    });
    console.log(JSON.stringify(result.verdict, null, 2));
    return result.verdict.overall.earned ? 0 : 1;
  }
  if (command === "readme") {
    const result = generateReadmeProjection({
      rootDir,
      reportsDir,
      out: optionValue(args, "--out", null),
    });
    console.log(JSON.stringify({
      targetPath: result.targetPath,
      sourceScanId: result.sourceScanId,
      sourceStoryReviewId: result.sourceStoryReviewId,
      stale: result.stale,
    }, null, 2));
    return result.stale ? 1 : 0;
  }
  if (command === "residue") {
    const result = buildCodebaseStoryReview({ rootDir, reportsDir });
    console.log(JSON.stringify(result.verdict.residue, null, 2));
    return result.verdict.residue.pressure === 0 ? 0 : 1;
  }
  printUsage();
  return 1;
}

if (require.main === module) {
  try {
    process.exit(runLocTaxonomy());
  } catch (error) {
    console.error(`loc-taxonomy failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  runLocTaxonomy,
};
