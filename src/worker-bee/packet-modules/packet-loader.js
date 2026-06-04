// warehouse:file
// responsibility: Delegates packet loading to focused modules; orchestrates file reading and normalization
// actor: worker_bee_infrastructure
// role: packet_loader_delegator
// source_truth: implementation

const { readPacketJsonFile } = require("./packet-file-reader");
const { normalizePacketFormat } = require("./packet-normalizer");

// warehouse:method
// responsibility: Loads packet configuration from JSON file and normalizes to bare packet format
// actor: worker_bee_infrastructure
// role: packet_loader_delegator
// source_truth: implementation
function loadPacketFile(path) {
  const parsed = readPacketJsonFile(path);
  return normalizePacketFormat(parsed);
}

module.exports = {
  loadPacketFile
};
