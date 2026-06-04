// warehouse:file
// responsibility: Loads packet configuration from JSON files
// actor: worker_bee_infrastructure
// role: infrastructure
// source_truth: implementation

const fs = require("fs");
const { isObject } = require("./object-utils");

// warehouse:method
// responsibility: Loads and unwraps packet configuration from JSON file (bare or wrapped format)
// actor: worker_bee_infrastructure
// role: infrastructure
// source_truth: implementation
function loadPacketFile(path) {
  const raw = fs.readFileSync(path, "utf8");
  const parsed = JSON.parse(raw);
  // Accept either a bare packet or { packet: {...} }.
  return parsed.packet && isObject(parsed.packet) ? parsed.packet : parsed;
}

module.exports = {
  loadPacketFile
};
