#!/usr/bin/env node
// Worker-bee REORGANIZE operation runner (deterministic).
//
// Reads a reorganize packet, plans the moves + every require() rewrite, verifies
// the resulting layout has ZERO broken requires, and only then applies. Dry-run
// by default. This is the deterministic self-heal that the manual bin/ move lacked.
//
// Usage:
//   node bin/worker-bee-reorganize.js --packet packets/reorg.packet.json [--apply] [--json]

const path = require("path");
const fs = require("fs");

const { planReorganize, applyReorganize, newlyBroken, baselineBrokenTargets } = require("../src/worker-bee/operations/reorganize");

const root = path.resolve(__dirname, "..");
let config = {};
const configPath = path.join(root, ".worker-bee.json");
if (fs.existsSync(configPath)) config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const REPO_ROOT = process.env.WORKER_BEE_REPO_ROOT || config.repoRoot || root;

function parseArgs(argv) {
  const a = { packet: null, apply: false, json: false };
  for (let i = 0; i < argv.length; i += 1) {
    switch (argv[i]) {
      case "--packet": a.packet = argv[++i]; break;
      case "--apply": a.apply = true; break;
      case "--json": a.json = true; break;
      case "-h": case "--help": a.help = true; break;
      default: console.error(`Unknown argument: ${argv[i]}`); process.exit(1);
    }
  }
  return a;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.packet) {
    process.stdout.write("Usage: worker-bee-reorganize --packet <packet.json> [--apply] [--json]\n");
    return args.packet ? 0 : 1;
  }

  const packet = JSON.parse(fs.readFileSync(path.resolve(args.packet), "utf8"));
  if (packet.operation !== "reorganize" || !Array.isArray(packet.moves)) {
    console.error('Packet must be { "operation": "reorganize", "moves": [ { from, to }, ... ] }');
    return 1;
  }

  const repoRoot = path.resolve(packet.repo_root || REPO_ROOT);
  const plan = planReorganize(repoRoot, packet.moves);
  const broken = newlyBroken(repoRoot, plan); // only breakage this plan would introduce

  if (args.json) {
    console.log(JSON.stringify({ ...plan, edits: undefined, sample_edits: plan.edits.slice(0, 12).map((e) => ({ from: path.relative(repoRoot, e.oldF), to: path.relative(repoRoot, e.newF), moved: e.moved, changes: e.changes })), broken }, null, 2));
  } else {
    console.log(`Worker-bee reorganize (${args.apply ? "APPLY" : "dry-run"})`);
    console.log(`  repo root:        ${repoRoot}`);
    console.log(`  moves:            ${plan.moves.length}`);
    console.log(`  files moved:      ${plan.moved_files}`);
    console.log(`  files touched:    ${plan.files_touched}`);
    console.log(`  require rewrites: ${plan.require_rewrites}`);
    console.log(`  package.json refs:${plan.pkgEdits ? " " + plan.pkgEdits.replacements.length : " 0"}`);
    console.log(`  post-plan broken requires: ${broken.length}`);
    const withChanges = plan.edits.filter((e) => e.changes.length).slice(0, 10);
    if (withChanges.length) {
      console.log("  sample require rewrites:");
      for (const e of withChanges) {
        console.log(`    ${path.relative(repoRoot, e.newF).split(path.sep).join("/")}`);
        for (const c of e.changes.slice(0, 3)) console.log(`      ${c.old}  ->  ${c.new}`);
      }
    }
  }

  if (broken.length > 0) {
    console.error(`\nRefusing to apply: plan would leave ${broken.length} broken require(s). First few:`);
    for (const b of broken.slice(0, 8)) console.error(`  - ${b.file}: ${b.spec}`);
    return 2;
  }

  if (args.apply) {
    const preBroken = baselineBrokenTargets(repoRoot);
    applyReorganize(repoRoot, plan);
    const postBroken = baselineBrokenTargets(repoRoot);
    const introduced = [...postBroken].filter((k) => !preBroken.has(k));
    console.log(`\nApplied. Newly broken requires after apply: ${introduced.length}`);
    return introduced.length > 0 ? 2 : 0;
  }

  console.log("\nDry run only. Re-run with --apply to perform the moves (safe: verified 0 broken requires).");
  return 0;
}

process.exit(main());
