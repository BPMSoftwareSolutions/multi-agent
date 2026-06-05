// warehouse:file
// responsibility: Verify the delivery lean-value scoring is deterministic and enforces review-before-removal safety invariants
// actor: delivery_test_author
// role: verifier
// source_truth: taxonomy/loc-delivery-chain.json

const assert = require("assert");
const path = require("path");
const { loadChain } = require("../src/observability/delivery-taxonomy-projection");
const { buildLeanValue } = require("../src/observability/delivery-lean-value");

const root = path.resolve(__dirname, "..");

// warehouse:method
// responsibility: Prove scoring the boundaries twice yields identical ledgers with no wall-clock or ordering drift
function verifyDeterministic() {
  const chain = loadChain(root);
  const a = buildLeanValue(chain, root);
  const b = buildLeanValue(chain, root);
  assert.deepStrictEqual(a.ledger, b.ledger, "lean value ledger must be deterministic");
  assert.strictEqual(a.ledger.schema, "loc-delivery-value-ledger.v1");
  assert.ok(a.ledger.entries.length > 0, "at least one boundary should be scored");
}

// warehouse:method
// responsibility: Prove every entry has a bounded value score and the required lean governance fields
function verifyLedgerShape() {
  const chain = loadChain(root);
  const { ledger } = buildLeanValue(chain, root);
  for (const e of ledger.entries) {
    assert.ok(e.value_score >= 0 && e.value_score <= 100, `value_score in range for ${e.path}`);
    for (const f of ["value_score_confidence", "runtime_use_signal", "value_visibility_finding", "recommended_disposition", "retirement_evidence_status"]) {
      assert.ok(e[f] !== undefined, `${f} present for ${e.path}`);
    }
  }
}

// warehouse:method
// responsibility: Prove no scored file is marked safe_to_remove without retirement evidence
function verifyRemovalSafety() {
  const chain = loadChain(root);
  const { ledger, retirementEvidence } = buildLeanValue(chain, root);
  for (const e of ledger.entries) assert.strictEqual(e.safe_to_remove, false, `safe_to_remove must default false for ${e.path}`);
  for (const c of retirementEvidence.candidates) assert.strictEqual(c.safe_to_remove, false, "retirement candidates must start unsafe");
}

verifyDeterministic();
verifyLedgerShape();
verifyRemovalSafety();
console.log("Delivery lean value verification passed.");
