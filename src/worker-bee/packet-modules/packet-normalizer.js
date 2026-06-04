// warehouse:file
// responsibility: Normalizes packet JSON to bare packet format, unwrapping from wrapper if present
// actor: worker_bee_infrastructure
// role: packet_normalizer
// source_truth: implementation

const { isObject } = require("./object-utils");

// warehouse:method
// responsibility: Normalizes packet JSON to bare packet format, unwrapping from wrapper if present — normalizePacketFormat
// actor: method_implementation
// role: implementation
// source_truth: implementation
function normalizePacketFormat(parsed) {
  // Accept either a bare packet or { packet: {...} }.
  return parsed.packet && isObject(parsed.packet) ? parsed.packet : parsed;
}

module.exports = { normalizePacketFormat };
