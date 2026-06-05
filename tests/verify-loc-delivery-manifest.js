const assert = require("assert");
const path = require("path");
const { loadDeliveryManifest } = require("../src/delivery/manifest-loader");
const { validateDeliveryManifest } = require("../src/delivery/manifest-validator");

function loadFixture(name) {
  return loadDeliveryManifest(path.join("tests", "fixtures", "delivery", name), {
    baseDir: path.resolve(__dirname, ".."),
  });
}

function expectInvalid(manifest, messagePart) {
  const result = validateDeliveryManifest(manifest);
  assert.strictEqual(result.valid, false, "expected manifest to be invalid");
  assert(result.errors.some((error) => error.includes(messagePart)), `expected error containing: ${messagePart}\nActual: ${result.errors.join("\n")}`);
}

const valid = loadFixture("honest-coherence.manifest.json");
valid.release_gates.waivers = [];
const validResult = validateDeliveryManifest(valid);
assert.strictEqual(validResult.valid, true, validResult.errors.join("; "));

const missingStory = loadFixture("invalid-missing-story.manifest.json");
expectInvalid(missingStory, "intent.story_id is required");

const missingAcceptance = loadFixture("invalid-missing-acceptance.manifest.json");
expectInvalid(missingAcceptance, "acceptance.scenarios must include at least one scenario");

const unknownScenarioLink = JSON.parse(JSON.stringify(valid));
unknownScenarioLink.implementation.changed_files[0].acceptance_links = ["SCN-UNKNOWN"];
expectInvalid(unknownScenarioLink, "acceptance_links contains unknown scenario id");

const mismatchedValueLink = JSON.parse(JSON.stringify(valid));
mismatchedValueLink.implementation.changed_files[0].value_link = "STORY-OTHER";
expectInvalid(mismatchedValueLink, "value_link must match intent.story_id");

const invalidGateValue = JSON.parse(JSON.stringify(valid));
invalidGateValue.release_gates.acceptance = "ignored";
expectInvalid(invalidGateValue, "release_gates.acceptance must be one of");

const acceptanceWaived = JSON.parse(JSON.stringify(valid));
acceptanceWaived.release_gates.acceptance = "waived";
acceptanceWaived.release_gates.waivers = [
  {
    gate: "acceptance",
    authority: "delivery_governance_board",
    reason: "temporary exception while evidence runner is staged",
    expiration: "2026-12-31T00:00:00Z",
    follow_up: "delivery-evidence-packet-002",
  },
];
const acceptanceWaivedResult = validateDeliveryManifest(acceptanceWaived);
assert.strictEqual(acceptanceWaivedResult.valid, true, acceptanceWaivedResult.errors.join("; "));

const taxonomyDisallowedWaived = JSON.parse(JSON.stringify(valid));
taxonomyDisallowedWaived.release_gates.local_taxonomy = "waived";
taxonomyDisallowedWaived.release_gates.waivers = [
  {
    gate: "local_taxonomy",
    authority: "delivery_governance_board",
    reason: "attempting an invalid waiver state",
    expiration: "2026-12-31T00:00:00Z",
    follow_up: "reject-invalid-waiver",
  },
];
expectInvalid(taxonomyDisallowedWaived, "cannot be waived under taxonomy");

console.log("LOC delivery manifest verification passed.");
