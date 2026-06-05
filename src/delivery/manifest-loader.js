// warehouse:file
// responsibility: load delivery manifest artifacts deterministically without mutating source truth
// actor: delivery_orchestrator
// role: loader
// source_truth: taxonomy/loc-delivery-chain.json

const fs = require("fs");
const path = require("path");

// warehouse:method
// responsibility: determine whether manifest input is already a plain object
// actor: method_implementation
// role: implementation
// source_truth: taxonomy/loc-delivery-chain.json
function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

// warehouse:method
// responsibility: resolve a manifest path deterministically and return the parsed manifest object without mutating inputs
// actor: method_implementation
// role: implementation
// source_truth: taxonomy/loc-delivery-chain.json
function loadDeliveryManifest(input, options = {}) {
  if (isObject(input)) {
    return input;
  }
  if (typeof input !== "string" || input.trim() === "") {
    throw new Error("Delivery manifest input must be a manifest object or file path.");
  }
  const baseDir = path.resolve(options.baseDir || process.cwd());
  const manifestPath = path.resolve(baseDir, input);
  const text = fs.readFileSync(manifestPath, "utf8");
  return JSON.parse(text);
}

module.exports = {
  loadDeliveryManifest,
};
