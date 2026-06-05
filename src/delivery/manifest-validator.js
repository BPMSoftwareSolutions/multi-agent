// warehouse:file
// responsibility: validate delivery manifest instances against canonical LOC delivery taxonomy rules
// actor: delivery_contract_consumer
// role: validator
// source_truth: taxonomy/loc-delivery-chain.json

const fs = require("fs");
const path = require("path");

const TAXONOMY_PATH = path.resolve(__dirname, "../../taxonomy/loc-delivery-chain.json");

// warehouse:method
// responsibility: read canonical delivery taxonomy data from the source truth file
// actor: method_implementation
// role: implementation
// source_truth: taxonomy/loc-delivery-chain.json
function loadTaxonomy() {
  return JSON.parse(fs.readFileSync(TAXONOMY_PATH, "utf8"));
}

const TAXONOMY = loadTaxonomy();
const GATE_POLICY = new Map(
  (TAXONOMY.gate_semantics?.per_gate_policy || []).map((entry) => [entry.gate, new Set(entry.allowed_states || [])])
);
const REQUIRED_RELEASE_GATES = [...GATE_POLICY.keys()];

// warehouse:method
// responsibility: determine whether a value is a plain object suitable for manifest validation
// actor: method_implementation
// role: implementation
// source_truth: taxonomy/loc-delivery-chain.json
function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

// warehouse:method
// responsibility: determine whether a string contains non-whitespace content for manifest validation
// actor: method_implementation
// role: implementation
// source_truth: taxonomy/loc-delivery-chain.json
function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

// warehouse:method
// responsibility: append a validation error message to the manifest error list
// actor: method_implementation
// role: implementation
// source_truth: taxonomy/loc-delivery-chain.json
function pushError(errors, message) {
  errors.push(message);
}

// warehouse:method
// responsibility: index waiver records by gate for deterministic waiver lookups
// actor: method_implementation
// role: implementation
// source_truth: taxonomy/loc-delivery-chain.json
function waiverByGate(waivers) {
  const map = new Map();
  for (const waiver of waivers) {
    if (!isObject(waiver) || !nonEmptyString(waiver.gate)) {
      continue;
    }
    map.set(waiver.gate, waiver);
  }
  return map;
}

// warehouse:method
// responsibility: return deterministic manifest validation errors from taxonomy rules
// actor: method_implementation
// role: implementation
// source_truth: taxonomy/loc-delivery-chain.json
function validateDeliveryManifest(manifest) {
  const errors = [];

  if (!isObject(manifest)) {
    pushError(errors, "manifest must be an object");
    return { valid: false, errors };
  }

  if (manifest.schema !== "loc-delivery-manifest.v1") {
    pushError(errors, "schema must equal loc-delivery-manifest.v1");
  }

  if (!nonEmptyString(manifest.delivery_id)) {
    pushError(errors, "delivery_id is required");
  }

  const intent = isObject(manifest.intent) ? manifest.intent : {};
  if (!nonEmptyString(intent.story_id)) pushError(errors, "intent.story_id is required");
  if (!nonEmptyString(intent.actor)) pushError(errors, "intent.actor is required");
  if (!nonEmptyString(intent.need)) pushError(errors, "intent.need is required");
  if (!nonEmptyString(intent.value)) pushError(errors, "intent.value is required");

  const acceptance = isObject(manifest.acceptance) ? manifest.acceptance : {};
  const scenarios = Array.isArray(acceptance.scenarios) ? acceptance.scenarios : null;
  if (!scenarios || scenarios.length === 0) {
    pushError(errors, "acceptance.scenarios must include at least one scenario");
  }

  const scenarioIds = new Set();
  if (scenarios) {
    scenarios.forEach((scenario, index) => {
      const prefix = `acceptance.scenarios[${index}]`;
      if (!isObject(scenario)) {
        pushError(errors, `${prefix} must be an object`);
        return;
      }
      if (!nonEmptyString(scenario.id)) pushError(errors, `${prefix}.id is required`);
      if (!nonEmptyString(scenario.name)) pushError(errors, `${prefix}.name is required`);
      if (!nonEmptyString(scenario.test_command) && !nonEmptyString(scenario.evidence)) {
        pushError(errors, `${prefix} must include either test_command or evidence`);
      }
      if (nonEmptyString(scenario.id)) {
        if (scenarioIds.has(scenario.id)) {
          pushError(errors, `${prefix}.id must be unique`);
        }
        scenarioIds.add(scenario.id);
      }
    });
  }

  const implementation = isObject(manifest.implementation) ? manifest.implementation : {};
  const changedFiles = Array.isArray(implementation.changed_files) ? implementation.changed_files : null;
  if (!changedFiles || changedFiles.length === 0) {
    pushError(errors, "implementation.changed_files must include at least one file");
  }

  const storyId = intent.story_id;
  if (changedFiles) {
    changedFiles.forEach((file, index) => {
      const prefix = `implementation.changed_files[${index}]`;
      if (!isObject(file)) {
        pushError(errors, `${prefix} must be an object`);
        return;
      }
      if (!nonEmptyString(file.path)) pushError(errors, `${prefix}.path is required`);
      if (!nonEmptyString(file.reason)) pushError(errors, `${prefix}.reason is required`);
      if (!nonEmptyString(file.value_link)) {
        pushError(errors, `${prefix}.value_link is required`);
      } else if (nonEmptyString(storyId) && file.value_link !== storyId) {
        pushError(errors, `${prefix}.value_link must match intent.story_id`);
      }
      const links = Array.isArray(file.acceptance_links) ? file.acceptance_links : null;
      if (!links || links.length === 0) {
        pushError(errors, `${prefix}.acceptance_links must include at least one scenario id`);
      } else {
        for (const link of links) {
          if (!scenarioIds.has(link)) {
            pushError(errors, `${prefix}.acceptance_links contains unknown scenario id: ${link}`);
          }
        }
      }
    });
  }

  const releaseGates = isObject(manifest.release_gates) ? manifest.release_gates : {};
  for (const gate of REQUIRED_RELEASE_GATES) {
    const allowed = GATE_POLICY.get(gate) || new Set();
    if (!nonEmptyString(releaseGates[gate])) {
      pushError(errors, `release_gates.${gate} is required`);
    } else if (!allowed.has(releaseGates[gate])) {
      pushError(errors, `release_gates.${gate} must be one of: ${[...allowed].join(", ")}`);
    }
  }
  const waivers = Array.isArray(releaseGates.waivers) ? releaseGates.waivers : null;
  if (!waivers) {
    pushError(errors, "release_gates.waivers is required");
  } else {
    const waiverMap = waiverByGate(waivers);
    waivers.forEach((waiver, index) => {
      const prefix = `release_gates.waivers[${index}]`;
      if (!isObject(waiver)) {
        pushError(errors, `${prefix} must be an object`);
        return;
      }
      if (!nonEmptyString(waiver.gate)) pushError(errors, `${prefix}.gate is required`);
      if (!nonEmptyString(waiver.authority)) pushError(errors, `${prefix}.authority is required`);
      if (!nonEmptyString(waiver.reason)) pushError(errors, `${prefix}.reason is required`);
      if (!nonEmptyString(waiver.expiration)) pushError(errors, `${prefix}.expiration is required`);
      if (!nonEmptyString(waiver.follow_up)) pushError(errors, `${prefix}.follow_up is required`);
      if (nonEmptyString(waiver.gate)) {
        const allowed = GATE_POLICY.get(waiver.gate) || new Set();
        if (!allowed.has("waived")) {
          pushError(errors, `${prefix}.gate cannot be waived under taxonomy`);
        }
        if (releaseGates[waiver.gate] !== "waived") {
          pushError(errors, `${prefix}.gate must be waived when a waiver record is present`);
        }
      }
    });
    for (const gate of REQUIRED_RELEASE_GATES) {
      if (releaseGates[gate] === "waived" && !waiverMap.has(gate)) {
        pushError(errors, `release_gates.waivers must include a waiver for waived gate: ${gate}`);
      }
    }
  }

  if (!isObject(manifest.learning)) {
    pushError(errors, "learning is required");
  } else if (!nonEmptyString(manifest.learning.record_path)) {
    pushError(errors, "learning.record_path is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  REQUIRED_RELEASE_GATES,
  validateDeliveryManifest,
};
