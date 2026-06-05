#!/usr/bin/env node
// warehouse:file
// responsibility: Generate the deterministic delivery lean-value ledger and candidate views from the canonical dataset
// actor: delivery_cli_operator
// role: entrypoint
// source_truth: taxonomy/loc-delivery-chain.json

const path = require("path");
const { loadChain } = require("../src/observability/delivery-taxonomy-projection");
const { buildLeanValue, writeLeanValue } = require("../src/observability/delivery-lean-value");

const root = process.env.WORKER_BEE_REPO_ROOT
  ? path.resolve(process.env.WORKER_BEE_REPO_ROOT)
  : path.resolve(__dirname, "..");

// warehouse:method
// responsibility: Build the lean value views and write them, or print the summary under check mode
function main() {
  const checkOnly = process.argv.includes("--check");
  const chain = loadChain(root);
  const built = buildLeanValue(chain, root);
  const s = built.ledger.summary;

  console.log("LOC delivery lean value");
  console.log(`  scored files: ${s.scored_files}  avg value: ${s.average_value}/100`);
  console.log(`  dispositions: ${Object.entries(s.by_disposition).map(([k, v]) => `${k}=${v}`).join(", ")}`);
  console.log(`  low_value: ${s.low_value_count}  unknown_runtime_use: ${s.unknown_runtime_use_count}  review_required: ${s.review_required_count}`);

  if (checkOnly) {
    // Low-confidence/unproven findings must route to review, never to silent removal.
    const unsafe = built.ledger.entries.filter((e) => e.safe_to_remove === true);
    const ok = unsafe.length === 0;
    console.log(ok ? "\nCheck passed: no file marked safe_to_remove without retirement evidence." : "\nCheck FAILED: a file is marked safe_to_remove.");
    return ok ? 0 : 1;
  }

  writeLeanValue(path.join(root, "reports"), built);
  console.log("\nWrote: reports/loc-delivery-taxonomy/latest/{value-ledger,quarantine-candidates,demotion-candidates,retirement-evidence,lean-delta}.json + reports/LOC-DELIVERY-LEAN-VALUE.md");
  return 0;
}

process.exit(main());
