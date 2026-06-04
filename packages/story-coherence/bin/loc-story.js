#!/usr/bin/env node
// warehouse:file
// responsibility: Provides loc story CLI commands for read only scan review packet check explain README projection and residue verdicts
// actor: loc_story_cli
// role: package_command
// source_truth: implementation

const {
  buildCodebaseStoryReview,
  buildStoryReasoningPacket,
  checkCodebaseStory,
  explainStoryPath,
  generateReadmeProjection,
  scanTaxonomy,
  writeStoryReasoningPacket,
} = require("../src/index");

// warehouse:method
// responsibility: Provides loc story CLI commands for read only scan review packet check explain README projection and residue verdicts
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
// responsibility: Provides loc story CLI commands for read only scan review packet check explain README projection and residue verdicts
// actor: method_implementation
// role: implementation
// source_truth: implementation
function positionalTarget(args) {
  const value = args.find((arg) => !arg.startsWith("-"));
  return value || ".";
}

// warehouse:method
// responsibility: Provides loc story CLI commands for read only scan review packet check explain README projection and residue verdicts
// actor: method_implementation
// role: implementation
// source_truth: implementation
function printUsage() {
  console.log([
    "Usage: loc-story <command> [target] [options]",
    "",
    "Commands:",
    "  scan [target]            Run deterministic taxonomy scan",
    "  review                   Build codebase story review from latest scan",
    "  packet                   Emit AI-ready story reasoning packet",
    "  check                    Check story coherence and README staleness",
    "  explain [target]         Explain the story boundary for a path",
    "  readme [target]          Generate README projection from latest scan/story review",
    "  residue                  Print residue verdict from latest story review",
    "",
    "Options:",
    "  --root <path>            Repository root (default: current directory)",
    "  --reports-dir <path>     Reports directory relative to root (default: reports)",
    "  --out <path>             Output path for readme or packet command",
    "  --for-ai                 Mark packet intent as AI review substrate",
    "  --write                  Write scan/story report artifacts",
  ].join("\n"));
}

// warehouse:method
// responsibility: Provides loc story CLI commands for read only scan review packet check explain README projection and residue verdicts
// actor: method_implementation
// role: implementation
// source_truth: implementation
function runLocStory(argv = process.argv.slice(2)) {
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
  if (command === "review" || command === "story-review") {
    const result = buildCodebaseStoryReview({
      rootDir,
      reportsDir,
      writeReports: args.includes("--write"),
    });
    console.log(JSON.stringify(result.verdict, null, 2));
    return result.verdict.overall.earned ? 0 : 1;
  }
  if (command === "packet") {
    const options = {
      rootDir,
      reportsDir,
      out: optionValue(args, "--out", null),
      purpose: args.includes("--for-ai") ? "ai-story-review" : "loc-governance-review",
    };
    const result = args.includes("--write") || options.out
      ? writeStoryReasoningPacket(options)
      : { packet: buildStoryReasoningPacket(options), outPath: null };
    console.log(JSON.stringify(result.packet, null, 2));
    if (result.outPath) {
      console.error(`Story reasoning packet written: ${result.outPath}`);
    }
    return result.packet.status === "story_coherence_earned" ? 0 : 1;
  }
  if (command === "check") {
    const result = checkCodebaseStory({ rootDir, reportsDir });
    console.log(JSON.stringify(result, null, 2));
    return result.exitCode;
  }
  if (command === "explain") {
    const result = explainStoryPath({
      rootDir,
      reportsDir,
      targetPath: positionalTarget(args),
    });
    console.log(JSON.stringify(result, null, 2));
    return result.role.includes("not inferred") ? 1 : 0;
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
    process.exit(runLocStory());
  } catch (error) {
    console.error(`loc-story failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  runLocStory,
};
