// warehouse:file
// responsibility: Parses CLI arguments for report configuration (target, output, format flags)
// actor: report_builder
// role: config_builder
// source_truth: implementation

const path = require("path");
const fs = require("fs");

// warehouse:method
// responsibility: Parses CLI arguments for report configuration (target, output, format flags)
// actor: method_implementation
// role: implementation
// source_truth: implementation
function parseReportArgs(argv, DEFAULT_REPO_ROOT, DEFAULT_TARGET) {
  const args = { repoRoot: DEFAULT_REPO_ROOT, target: DEFAULT_TARGET, output: null, json: false };
  for (let i = 0; i < argv.length; i += 1) {
// warehouse:method
// responsibility: Parses CLI arguments for report configuration (target, output, format flags)
// actor: method_implementation
// role: implementation
// source_truth: implementation
    const next = () => argv[++i];
    switch (argv[i]) {
      case "--repo-root": args.repoRoot = next(); break;
      case "--target": args.target = next(); break;
      case "--output": args.output = next(); break;
      case "--json": args.json = true; break;
      default: console.error(`Unknown argument: ${argv[i]}`); process.exit(1);
    }
  }
  return args;
}

module.exports = { parseReportArgs };
