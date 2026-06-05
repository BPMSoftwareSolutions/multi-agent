#!/usr/bin/env node

const path = require("path");

const { buildDeliveryReadiness } = require("../src/delivery/release-readiness");
const { loadDeliveryManifest } = require("../src/delivery/manifest-loader");
const { validateDeliveryManifest } = require("../src/delivery/manifest-validator");

function parseArgs(argv) {
  const args = {
    command: null,
    manifest: null,
    root: process.cwd(),
    reportsDir: "reports",
    help: false,
  };

  const rest = argv.slice();
  if (rest.length > 0 && !rest[0].startsWith("-")) {
    args.command = rest.shift();
  }

  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    switch (token) {
      case "--manifest":
        args.manifest = rest[++i];
        break;
      case "--root":
        args.root = rest[++i];
        break;
      case "--reports-dir":
        args.reportsDir = rest[++i];
        break;
      case "-h":
      case "--help":
        args.help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${token}`);
    }
  }

  return args;
}

function printUsage() {
  console.log([
    "Usage: loc-delivery <command> --manifest <path> [options]",
    "",
    "Commands:",
    "  validate    Validate a LOC delivery manifest",
    "  check       Build delivery readiness report and write artifacts",
    "",
    "Options:",
    "  --root <path>         Repository root (default: current directory)",
    "  --reports-dir <path>  Reports directory relative to root (default: reports)",
  ].join("\n"));
}

function printValidationResult(result, manifestPath) {
  if (result.valid) {
    console.log(`valid: ${manifestPath}`);
    return 0;
  }
  console.log(`invalid: ${manifestPath}`);
  for (const error of result.errors) {
    console.log(`- ${error}`);
  }
  return 1;
}

function runValidate(args) {
  const manifest = loadDeliveryManifest(args.manifest, { baseDir: args.root });
  const result = validateDeliveryManifest(manifest);
  return printValidationResult(result, path.resolve(args.root, args.manifest));
}

function runCheck(args) {
  const result = buildDeliveryReadiness({
    manifestPath: args.manifest,
    rootDir: args.root,
    reportsDir: args.reportsDir,
    writeReports: true,
  });
  console.log(JSON.stringify({
    delivery_id: result.readiness.delivery_id,
    status: result.readiness.status,
    blocking_gates: result.readiness.blocking_gates,
    output: result.artifacts,
  }, null, 2));
  return result.readiness.status === "release_ready" ? 0 : 1;
}

function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help || !args.command) {
    printUsage();
    return args.command ? 0 : 1;
  }
  if (!args.manifest) {
    console.error("--manifest is required");
    printUsage();
    return 1;
  }

  if (args.command === "validate") {
    return runValidate(args);
  }
  if (args.command === "check") {
    return runCheck(args);
  }

  console.error(`Unknown command: ${args.command}`);
  printUsage();
  return 1;
}

if (require.main === module) {
  try {
    process.exit(main());
  } catch (error) {
    console.error(`loc-delivery failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  main,
};
