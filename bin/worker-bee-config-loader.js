// warehouse:file
// responsibility: Loads worker-bee configuration from disk with fallback to empty config
// actor: config_loader
// role: configuration_supplier
// source_truth: implementation

const fs = require("fs");
const path = require("path");

function loadWorkerBeeConfig(root) {
  let config = {};
  const configPath = path.join(root, ".worker-bee.json");
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  }
  return config;
}

module.exports = { loadWorkerBeeConfig };
