#!/usr/bin/env node
// Single CLI entry point for the studio. `studio <command> [args]` dispatches to
// the matching cli/<command>.js. The command scripts stay standalone (and keep
// their own root resolution, since cli/ is one level under the project root) — the
// dispatcher just routes, so adding a command = adding a file here. No bin/.

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const HERE = __dirname;
const SELF = path.basename(__filename);

function listCommands() {
  return fs
    .readdirSync(HERE)
    .filter((f) => f.endsWith(".js") && f !== SELF)
    .map((f) => f.replace(/\.js$/, ""))
    .sort();
}

function printUsage() {
  console.log("Usage: studio <command> [args]\n");
  console.log("Commands:");
  for (const c of listCommands()) console.log("  " + c);
  console.log("\nRun 'studio <command> --help' for command-specific help.");
}

const cmd = process.argv[2];
if (!cmd || cmd === "-h" || cmd === "--help") {
  printUsage();
  process.exit(cmd ? 0 : 1);
}

const file = path.join(HERE, cmd + ".js");
if (!fs.existsSync(file) || path.resolve(file) === path.resolve(__filename)) {
  console.error(`Unknown command: ${cmd}\n`);
  printUsage();
  process.exit(1);
}

const result = spawnSync(process.execPath, [file, ...process.argv.slice(3)], { stdio: "inherit" });
process.exit(result.status == null ? 1 : result.status);
