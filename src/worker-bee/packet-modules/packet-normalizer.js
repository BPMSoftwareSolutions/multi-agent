// warehouse:file
// responsibility: Format normalizer: unwraps packet JSON from wrapper structure and converts to canonical bare packet object
// actor: worker_bee_infrastructure
// role: packet_normalizer
// source_truth: implementation

const { isObject } = require("./object-utils");

// warehouse:method
// responsibility: Packet unwrapper: extracts bare packet from wrapper or returns input if already bare, enabling polymorphic packet loading
// actor: worker_bee_infrastructure
// role: packet_normalizer
// source_truth: implementation
function normalizePacketFormat(parsed) {
  // Accept either a bare packet or { packet: {...} }.
  return parsed.packet && isObject(parsed.packet) ? parsed.packet : parsed;
}

module.exports = { normalizePacketFormat };
