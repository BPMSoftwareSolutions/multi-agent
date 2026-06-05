const fs = require("fs");
const path = require("path");

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

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
