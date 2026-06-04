// warehouse:file
// responsibility: Reads packet configuration from JSON files on disk and parses to JavaScript objects
// actor: worker_bee_infrastructure
// role: packet_file_reader
// source_truth: implementation

const fs = require("fs");

// warehouse:method
// responsibility: Reads and parses JSON file content from disk, returns parsed JSON object
// actor: method_implementation
// role: implementation
// source_truth: implementation
function readPacketJsonFile(path) {
  const raw = fs.readFileSync(path, "utf8");
  return JSON.parse(raw);
}

module.exports = { readPacketJsonFile };
