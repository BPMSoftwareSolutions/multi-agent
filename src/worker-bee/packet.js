// warehouse:file
// responsibility: Defines packet schema, workload defaults, and merges configuration from files and CLI overrides
// actor: worker_bee_infrastructure
// role: infrastructure
// source_truth: implementation

// The packet is the instruction that determines a bee's workload. The bee does
// NOT decide how much it carries — the packet does. This mirrors the substrate
// pattern in ai-engine: an external, declarative spec drives the worker.
//
// Nothing in run-file-swarm.js hardcodes a limit; every workload number is read
// from the packet. Defaults live HERE, in one place, and can be overridden by a
// packet file (--packet) or by CLI flags.

const fs = require("fs");
const { DEFAULT_MODEL } = require("./gemini-client");

// The one place workload defaults are defined.
const DEFAULT_PACKET = {
  schema: "worker-bee-packet.v1",
  layer: "file", // file | method | both
  mode: "all", // all | missing | revalidate
  model: DEFAULT_MODEL,
  swarm: {
    agents: 5, // how many bees fly at once
    max_passes: 3, // self-heal: re-run until clean or no progress
  },
  workload: {
    // "How much weight a bee carries per request."
    anchor_budget: 150, // approx anchors (file + methods) per Gemini request
    max_files_per_packet: 40, // cap on files packed into one request
    input_char_budget: 600000, // cap on input chars packed into one request
    file_char_budget: 400000, // per-file content cap when building a prompt
    method_batch: 25, // methods per call when a single file is oversize
    max_output_tokens: 32768, // model output cap per request (gemini-2.5-flash allows up to 65536)
  },
};

function isObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

// Shallow-deep merge: nested `swarm` and `workload` objects merge field-by-field;
// everything else is replaced. Undefined/null overrides are ignored.
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

// Drop undefined/null leaves so a sparse override doesn't blank a default.
function prune(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    out[k] = v;
  }
  return out;
}

function loadPacketFile(path) {
  const raw = fs.readFileSync(path, "utf8");
  const parsed = JSON.parse(raw);
  // Accept either a bare packet or { packet: {...} }.
  return parsed.packet && isObject(parsed.packet) ? parsed.packet : parsed;
}

// Build the effective packet: defaults <- packet file <- CLI overrides.
function buildPacket({ file, overrides } = {}) {
  let packet = DEFAULT_PACKET;
  if (file) packet = mergePacket(packet, loadPacketFile(file));
  if (overrides) packet = mergePacket(packet, overrides);
  return packet;
}

function describePacket(packet) {
  const w = packet.workload;
  return [
    `  layer: ${packet.layer}   mode: ${packet.mode}   model: ${packet.model}`,
    `  swarm: ${packet.swarm.agents} bees, up to ${packet.swarm.max_passes} passes`,
    `  workload/bee: anchor_budget=${w.anchor_budget}, max_files=${w.max_files_per_packet}, method_batch=${w.method_batch}, max_output_tokens=${w.max_output_tokens}`,
  ].join("\n");
}

module.exports = { DEFAULT_PACKET, buildPacket, mergePacket, loadPacketFile, describePacket };
