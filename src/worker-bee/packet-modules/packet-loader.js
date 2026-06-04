// warehouse:file
// responsibility: Loads packet configuration from JSON file and normalizes to bare packet format
// actor: worker_bee_infrastructure
// role: packet_loader
// source_truth: implementation

const fs = require("fs");
const { isObject } = require("./object-utils");

// warehouse:method
// responsibility: Loads packet configuration from JSON file and normalizes to bare packet format
// actor: method_implementation
// role: implementation
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
