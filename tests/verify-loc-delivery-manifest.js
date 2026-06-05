const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { loadDeliveryManifest } = require("../src/delivery/manifest-loader");
const { validateDeliveryManifest } = require("../src/delivery/manifest-validator");
const { extractFromFile } = require("../src/taxonomy/extractor");

function loadFixture(name) {
  return loadDeliveryManifest(path.join("tests", "fixtures", "delivery", name), {
    baseDir: path.resolve(__dirname, ".."),
  });
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function expectInvalid(manifest, messagePart) {
  const result = validateDeliveryManifest(manifest);
  assert.strictEqual(result.valid, false, "expected manifest to be invalid");
  assert(result.errors.some((error) => error.includes(messagePart)), `expected error containing: ${messagePart}\nActual: ${result.errors.join("\n")}`);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, "..", relativePath), "utf8"));
}

function assertSchemaParity() {
  const taxonomy = readJson("taxonomy/loc-delivery-chain.json");
  const schema = readJson("contracts/loc-delivery-manifest.schema.json");
  const releaseGateSchema = schema.properties?.release_gates?.properties || {};
  const policy = taxonomy.gate_semantics?.per_gate_policy || [];
  const taxonomyGateNames = policy.map((gatePolicy) => gatePolicy.gate);
  const schemaGateNames = Object.keys(releaseGateSchema).filter((gate) => gate !== "waivers");
  assert.deepStrictEqual(
    schemaGateNames.sort(),
    taxonomyGateNames.slice().sort(),
    "schema release gate properties should match taxonomy gate list"
  );

  for (const gatePolicy of policy) {
    const schemaEnum = releaseGateSchema[gatePolicy.gate]?.enum || [];
    assert.deepStrictEqual(
      schemaEnum,
      gatePolicy.allowed_states,
      `schema enum drift for gate ${gatePolicy.gate}`
    );
  }

  const schemaRequired = schema.properties?.release_gates?.required || [];
  for (const gateName of [...taxonomyGateNames, "waivers"]) {
    assert(
      schemaRequired.includes(gateName),
      `schema.release_gates.required should include ${gateName}`
    );
  }

  const waiverEnum = releaseGateSchema.waivers?.items?.properties?.gate?.enum || [];
  const waiverCapableGates = policy
    .filter((gatePolicy) => (gatePolicy.allowed_states || []).includes("waived"))
    .map((gatePolicy) => gatePolicy.gate);
  assert.deepStrictEqual(
    waiverEnum.slice().sort(),
    waiverCapableGates.slice().sort(),
    "schema waiver gate enum should match taxonomy waiver-capable gates"
  );
}

function assertManifestLoaderTaxonomy() {
  const rootDir = path.resolve(__dirname, "..");
  const taxonomy = extractFromFile(path.join(rootDir, "src", "delivery", "manifest-loader.js"), rootDir);
  assert(taxonomy, "manifest loader should expose scanner-readable taxonomy");
  assert.strictEqual(taxonomy.file.responsibility, "load delivery manifest artifacts deterministically without mutating source truth");
  assert.strictEqual(taxonomy.file.actor, "delivery_orchestrator");
  assert.strictEqual(taxonomy.file.role, "loader");
  assert.strictEqual(taxonomy.file.source_truth, "taxonomy/loc-delivery-chain.json");
  const methods = new Map(taxonomy.methods.map((method) => [method.name, method.taxonomy]));
  assert(methods.has("isObject"), "manifest loader should anchor isObject");
  assert(methods.has("loadDeliveryManifest"), "manifest loader should anchor loadDeliveryManifest");
  assert.strictEqual(
    methods.get("loadDeliveryManifest").responsibility,
    "resolve a manifest path deterministically and return the parsed manifest object without mutating inputs"
  );
  assert.strictEqual(taxonomy.documentedMethods, taxonomy.totalMethods, "manifest loader should document all detected methods");
}

function assertManifestValidatorTaxonomy() {
  const rootDir = path.resolve(__dirname, "..");
  const taxonomy = extractFromFile(path.join(rootDir, "src", "delivery", "manifest-validator.js"), rootDir);
  assert(taxonomy, "manifest validator should expose scanner-readable taxonomy");
  assert.strictEqual(taxonomy.file.responsibility, "validate delivery manifest instances against canonical LOC delivery taxonomy rules");
  assert.strictEqual(taxonomy.file.actor, "delivery_contract_consumer");
  assert.strictEqual(taxonomy.file.role, "validator");
  assert.strictEqual(taxonomy.file.source_truth, "taxonomy/loc-delivery-chain.json");

  const methods = new Map(taxonomy.methods.map((method) => [method.name, method.taxonomy]));
  const expectedMethods = [
    "loadTaxonomy",
    "isObject",
    "nonEmptyString",
    "pushError",
    "waiverByGate",
    "validateDeliveryManifest",
  ];
  for (const methodName of expectedMethods) {
    assert(methods.has(methodName), `manifest validator should anchor ${methodName}`);
  }
  assert.strictEqual(
    methods.get("loadTaxonomy").responsibility,
    "read canonical delivery taxonomy data from the source truth file"
  );
  assert.strictEqual(
    methods.get("waiverByGate").responsibility,
    "index waiver records by gate for deterministic waiver lookups"
  );
  assert.strictEqual(
    methods.get("validateDeliveryManifest").responsibility,
    "return deterministic manifest validation errors from taxonomy rules"
  );
  assert.strictEqual(taxonomy.documentedMethods, taxonomy.totalMethods, "manifest validator should document all detected methods");
}

const valid = loadFixture("honest-coherence.manifest.json");
valid.release_gates.waivers = [];
const validResult = validateDeliveryManifest(valid);
assert.strictEqual(validResult.valid, true, validResult.errors.join("; "));
assertSchemaParity();
assertManifestLoaderTaxonomy();
assertManifestValidatorTaxonomy();

const fixturePath = path.join("tests", "fixtures", "delivery", "honest-coherence.manifest.json");
const firstLoad = loadDeliveryManifest(fixturePath, {
  baseDir: path.resolve(__dirname, ".."),
});
const secondLoad = loadDeliveryManifest(fixturePath, {
  baseDir: path.resolve(__dirname, ".."),
});
assert.deepStrictEqual(firstLoad, secondLoad, "loading the same manifest twice should be deterministic");
const snapshot = deepClone(firstLoad);
firstLoad.intent.need = "mutated in test only";
assert.notDeepStrictEqual(firstLoad, snapshot, "test should be able to mutate the returned object copy");
const thirdLoad = loadDeliveryManifest(fixturePath, {
  baseDir: path.resolve(__dirname, ".."),
});
assert.deepStrictEqual(thirdLoad, snapshot, "reloading should return an unmutated manifest from source");

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
