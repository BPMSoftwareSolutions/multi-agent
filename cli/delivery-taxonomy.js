#!/usr/bin/env node
// warehouse:file
// responsibility: Generate or verify the deterministic read-only delivery taxonomy projection from the canonical dataset
// actor: delivery_cli_operator
// role: entrypoint
// source_truth: taxonomy/loc-delivery-chain.json

const fs = require("fs");
const path = require("path");
const { loadChain, buildAll, writeProjection } = require("../src/observability/delivery-taxonomy-projection");

const root = process.env.WORKER_BEE_REPO_ROOT
  ? path.resolve(process.env.WORKER_BEE_REPO_ROOT)
  : path.resolve(__dirname, "..");
const reportsDir = path.join(root, "reports");

// warehouse:method
// responsibility: Report whether the on-disk artifacts already match the freshly built projection
// actor: method_implementation
// role: implementation
// source_truth: taxonomy/loc-delivery-chain.json
function drift(built) {
  const latestDir = path.join(reportsDir, "loc-delivery-taxonomy", "latest");
  const expected = {
    [path.join(latestDir, "taxonomy.json")]: JSON.stringify(built.projection, null, 2) + "\n",
    [path.join(latestDir, "agent-packet.json")]: JSON.stringify(built.agentPacket, null, 2) + "\n",
    [path.join(reportsDir, "LOC-DELIVERY-TAXONOMY.md")]: built.markdown,
  };
  const drifted = [];
  for (const [p, text] of Object.entries(expected)) {
    if (!fs.existsSync(p) || fs.readFileSync(p, "utf8") !== text) drifted.push(path.relative(root, p).replace(/\\/g, "/"));
  }
  return drifted;
}

// warehouse:method
// responsibility: Route the generate and check commands to deterministic projection logic and set exit codes
// actor: method_implementation
// role: implementation
// source_truth: taxonomy/loc-delivery-chain.json
function main() {
  const checkOnly = process.argv.includes("--check");
  const chain = loadChain(root);
  const built = buildAll(chain, root);
  const c = built.coverage;

  console.log("LOC delivery taxonomy projection");
  console.log(`  source: taxonomy/loc-delivery-chain.json  (dataset ${chain.generated_at})`);
  console.log(`  boundaries: ${c.source_boundary_count} source + ${c.report_boundary_count} report`);
  console.log(`  delivery files: ${c.discovered_delivery_file_count} discovered, ${c.explained_files.length} explained`);
  console.log(`  explains every file: ${c.explains_every_file ? "yes" : "NO"}`);
  if (c.missing_files.length) console.log(`  missing boundary files: ${c.missing_files.join(", ")}`);
  if (c.orphan_files.length) console.log(`  orphan delivery files: ${c.orphan_files.join(", ")}`);

  if (checkOnly) {
    const drifted = drift(built);
    if (drifted.length) {
      console.error(`\nProjection drift: ${drifted.length} artifact(s) differ from canonical data. Run 'npm run delivery:taxonomy' to regenerate.`);
      for (const d of drifted) console.error(`  - ${d}`);
    }
    const ok = c.explains_every_file && drifted.length === 0;
    console.log(ok ? "\nCheck passed: deterministic and complete." : "\nCheck FAILED.");
    return ok ? 0 : 1;
  }

  const paths = writeProjection(reportsDir, built);
  console.log("\nWrote:");
  for (const p of Object.values(paths)) console.log(`  ${path.relative(root, p).replace(/\\/g, "/")}`);
  return c.explains_every_file ? 0 : 1;
}

process.exit(main());
