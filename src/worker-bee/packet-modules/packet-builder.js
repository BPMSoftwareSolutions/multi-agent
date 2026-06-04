// warehouse:file
// responsibility: Builds packet configurations: merges base and override with shallow-deep strategy for swarm and workload and Builds effective packet configuration by layering defaults, file configuration, and CLI overrides and Builds packet configurations: describes packet in human-readable format for introspection
// actor: worker_bee_infrastructure
// role: packet_builder
// source_truth: implementation

const { isObject, prune } = require("./object-utils");
const { loadPacketFile } = require("./packet-loader");

const DEFAULT_PACKET = {
  schema: "worker-bee-packet.v1",
  layer: "file",
  mode: "all",
  model: null,
  swarm: {
    agents: 5,
    max_passes: 3,
  },
  workload: {
    anchor_budget: 150,
    max_files_per_packet: 40,
    input_char_budget: 600000,
    file_char_budget: 400000,
    method_batch: 25,
    max_output_tokens: 32768,
  },
};

// warehouse:method
// responsibility: Builds packet configurations: merges base and override with shallow-deep strategy for swarm and workload and Builds effective packet configuration by layering defaults, file configuration, and CLI overrides and Builds packet configurations: describes packet in human-readable format for introspection
// actor: method_implementation
// role: implementation
// source_truth: implementation
function mergePacket(base, override) {
  if (!isObject(override)) return base;
  const out = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined || value === null) continue;
    if (isObject(value) && isObject(base[key])) out[key] = { ...base[key], ...prune(value) };
    else out[key] = value;
  }
  return out;
}

// warehouse:method
// responsibility: Builds packet configurations: merges base and override with shallow-deep strategy for swarm and workload and Builds effective packet configuration by layering defaults, file configuration, and CLI overrides and Builds packet configurations: describes packet in human-readable format for introspection
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildPacket({ file, overrides } = {}) {
  let packet = DEFAULT_PACKET;
  if (file) packet = mergePacket(packet, loadPacketFile(file));
  if (overrides) packet = mergePacket(packet, overrides);
  return packet;
}

// warehouse:method
// responsibility: Builds packet configurations: merges base and override with shallow-deep strategy for swarm and workload and Builds effective packet configuration by layering defaults, file configuration, and CLI overrides and Builds packet configurations: describes packet in human-readable format for introspection
// actor: method_implementation
// role: implementation
// source_truth: implementation
function describePacket(packet) {
  const w = packet.workload;
  return [
    `  layer: ${packet.layer}   mode: ${packet.mode}   model: ${packet.model}`,
    `  swarm: ${packet.swarm.agents} bees, up to ${packet.swarm.max_passes} passes`,
    `  workload/bee: anchor_budget=${w.anchor_budget}, max_files=${w.max_files_per_packet}, method_batch=${w.method_batch}, max_output_tokens=${w.max_output_tokens}`,
  ].join("\n");
}

module.exports = {
  DEFAULT_PACKET,
  mergePacket,
  buildPacket,
  describePacket
};
