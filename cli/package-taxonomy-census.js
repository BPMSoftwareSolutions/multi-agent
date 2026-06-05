#!/usr/bin/env node
// warehouse:file
// responsibility: Generate or check deterministic package taxonomy census reports for the neighboring ai-engine packages
// actor: delivery_cli_operator
// role: entrypoint
// source_truth: taxonomy/loc-delivery-chain.json

const path = require("path");
const {
  buildPackageTaxonomyCensus,
  checkPackageTaxonomyCensusReports,
  writePackageTaxonomyCensusReports,
} = require("../src/observability/package-taxonomy-census");

// warehouse:method
// responsibility: Parse package taxonomy census CLI flags into package root, report root, and check mode
function parseArgs(argv) {
  const args = {
    root: path.resolve(__dirname, ".."),
    packagesRoot: "",
    reportsDir: "reports",
    check: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--root") args.root = path.resolve(argv[++i]);
    else if (token === "--packages-root") args.packagesRoot = path.resolve(argv[++i]);
    else if (token === "--reports-dir") args.reportsDir = argv[++i];
    else if (token === "--check") args.check = true;
    else if (token === "-h" || token === "--help") args.help = true;
  }
  if (!args.packagesRoot) args.packagesRoot = path.resolve(args.root, "..", "ai-engine", "packages");
  return args;
}

// warehouse:method
// responsibility: Print package taxonomy census CLI usage guidance
function printUsage() {
  console.log("Usage: package-taxonomy-census [--check] [--root <repo>] [--packages-root <path>] [--reports-dir <path>]");
}

// warehouse:method
// responsibility: Run package taxonomy census generation or drift checking and print operator summary
function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    printUsage();
    return 0;
  }

  const census = buildPackageTaxonomyCensus(args.packagesRoot);
  const s = census.summary;
  console.log("Package taxonomy census");
  console.log(`  packages: ${s.package_count}  wpi: ${s.wpi_count}  worker_review: ${s.worker_review_count}`);
  console.log(`  python files: ${s.python_file_count}  full anchors: ${s.python_full_file_anchor_count}  method anchors: ${s.python_method_anchor_count}`);

  if (args.check) {
    const check = checkPackageTaxonomyCensusReports(args.root, census, { reportsDir: args.reportsDir });
    if (!check.ok) {
      console.log("\nCheck failed: package taxonomy census reports are stale.");
      for (const entry of check.drift) console.log(`  ${entry.reason}: ${entry.path}`);
      return 1;
    }
    console.log("\nCheck passed: package taxonomy census reports are current.");
    return 0;
  }

  writePackageTaxonomyCensusReports(args.root, census, { reportsDir: args.reportsDir });
  console.log("\nWrote reports/package-taxonomy-census/latest.json, reports/package-taxonomy-census/worker-input.json, and reports/PACKAGE-TAXONOMY-CENSUS-LATEST.md");
  return 0;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = { parseArgs, main };
