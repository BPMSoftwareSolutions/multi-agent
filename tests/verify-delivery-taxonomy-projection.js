// warehouse:file
// responsibility: Verify the delivery taxonomy projection is deterministic, read-only, and explains every delivery file
// actor: delivery_test_author
// role: verifier
// source_truth: taxonomy/loc-delivery-chain.json

const assert = require("assert");
const path = require("path");
const { loadChain, buildAll, computeCoverage } = require("../src/observability/delivery-taxonomy-projection");

const root = path.resolve(__dirname, "..");

// warehouse:method
// responsibility: Prove building the projection twice yields byte-identical artifacts with no wall-clock drift
// actor: method_implementation
// role: implementation
// source_truth: taxonomy/loc-delivery-chain.json
function verifyDeterministic() {
  const chain = loadChain(root);
  const a = buildAll(chain, root);
  const b = buildAll(chain, root);
  assert.deepStrictEqual(a.projection, b.projection, "taxonomy projection must be deterministic");
  assert.deepStrictEqual(a.agentPacket, b.agentPacket, "agent packet must be deterministic");
  assert.strictEqual(a.markdown, b.markdown, "markdown must be deterministic");
  assert.strictEqual(a.projection.schema, "loc-delivery-taxonomy-projection.v1");
  assert.strictEqual(a.agentPacket.schema, "loc-delivery-taxonomy-agent-packet.v1");
}

// warehouse:method
// responsibility: Prove the canonical taxonomy explains every real delivery file with no missing or orphan boundaries
// actor: method_implementation
// role: implementation
// source_truth: taxonomy/loc-delivery-chain.json
function verifyCoverage() {
  const chain = loadChain(root);
  const coverage = computeCoverage(chain, root);
  assert.strictEqual(coverage.missing_files.length, 0, `boundary files must exist: ${coverage.missing_files.join(", ")}`);
  assert.strictEqual(coverage.orphan_files.length, 0, `every delivery file must have a boundary: ${coverage.orphan_files.join(", ")}`);
  assert.strictEqual(coverage.explains_every_file, true, "taxonomy must explain every delivery file");
  assert.ok(coverage.discovered_delivery_file_count > 0, "at least one delivery file should be discovered");
}

verifyDeterministic();
verifyCoverage();
console.log("Delivery taxonomy projection verification passed.");
