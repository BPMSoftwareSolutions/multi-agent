// warehouse:file
// responsibility: Coordinates loadWorkerBeeConfig behavior with documented file and method taxonomy evidence
// actor: config_loader
// role: configuration_supplier
// source_truth: implementation

const fs = require("fs");
const path = require("path");

// warehouse:method
// responsibility: Coordinates loadWorkerBeeConfig behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function loadWorkerBeeConfig(root) {
  let config = {};
  const configPath = path.join(root, ".worker-bee.json");
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  }
  return config;
}

module.exports = { loadWorkerBeeConfig };
