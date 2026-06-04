// warehouse:file
// responsibility: Delegator for packet schema and configuration management
// actor: worker_bee_infrastructure
// role: delegator
// source_truth: implementation

// The packet is the instruction that determines a bee's workload. The bee does
// NOT decide how much it carries — the packet does. This mirrors the substrate
// pattern in ai-engine: an external, declarative spec drives the worker.
//
// Nothing in run-file-swarm.js hardcodes a limit; every workload number is read
// from the packet. Defaults live in packet-modules/packet-builder.js, in one place,
// and can be overridden by a packet file (--packet) or by CLI flags.

const { DEFAULT_MODEL } = require("./gemini-client");
const { DEFAULT_PACKET: BASE_PACKET, buildPacket, mergePacket, describePacket } = require("./packet-modules/packet-builder");
const { loadPacketFile } = require("./packet-modules/packet-loader");

// Re-export with model override applied
const DEFAULT_PACKET = { ...BASE_PACKET, model: DEFAULT_MODEL };

module.exports = { DEFAULT_PACKET, buildPacket, mergePacket, loadPacketFile, describePacket };
