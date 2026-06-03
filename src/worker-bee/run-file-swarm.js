// Packet swarm: a few bees, each carrying a PACKET of many files in ONE Gemini
// request. Packets are sized by an output-anchor budget so dozens of small files
// ride together, while a method-heavy file splits into its own batched packet.
// This minimizes request count (the real rate-limit driver).

const fs = require("fs");
const { PACKET_SYSTEM_INSTRUCTION, COMBINED_SYSTEM_INSTRUCTION } = require("./anchor-spec");
const { stripBom, buildAnchorBlock, insertAnchor, replaceAnchor } = require("./scan");
const { applyMethodAnchors } = require("./methods");
const { callGeminiJSON } = require("./gemini-client");

// No workload limits are defined here. Every number comes from the packet
// (packet.workload), so an external instruction determines how much a bee carries.

function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function readForPrompt(absPath, fileCharBudget) {
  let text;
  try {
    text = stripBom(fs.readFileSync(absPath, "utf8"));
  } catch (_e) {
    return "";
  }
  return text.length <= fileCharBudget ? text : text.slice(0, fileCharBudget) + "\n# ...[truncated]...";
}

function anchorCost(item) {
  return (item.doFile ? 1 : 0) + (item.doMethods ? item.methodsNeeding.length : 0);
}

function fileChars(item) {
  try {
    return fs.statSync(item.absPath).size;
  } catch (_e) {
    return 0;
  }
}

// Greedily pack work items into packets bounded by the packet's workload limits.
// A file whose own anchor cost exceeds the budget becomes a dedicated "oversize"
// packet that is method-batched internally.
function packWork(work, workload) {
  const fileCap = workload.max_files_per_packet;
  const anchorBudget = workload.anchor_budget;
  const charBudget = workload.input_char_budget;
  const packets = [];
  let cur = null;
  const flush = () => {
    if (cur && cur.items.length) packets.push(cur);
    cur = null;
  };
  for (const item of work) {
    const cost = anchorCost(item);
    if (cost > anchorBudget) {
      flush();
      packets.push({ items: [item], oversize: true });
      continue;
    }
    const chars = fileChars(item);
    if (!cur) cur = { items: [], cost: 0, chars: 0, oversize: false };
    if (cur.items.length >= fileCap || cur.cost + cost > anchorBudget || cur.chars + chars > charBudget) {
      flush();
      cur = { items: [], cost: 0, chars: 0, oversize: false };
    }
    cur.items.push(item);
    cur.cost += cost;
    cur.chars += chars;
  }
  flush();
  return packets;
}

function methodList(item) {
  if (!item.doMethods || !item.methodsNeeding.length) return "METHODS TO ANCHOR: none — return an empty methods array.";
  return "METHODS TO ANCHOR (ids):\n" + item.methodsNeeding.map((d) => `${d.id}: ${d.name} (line ${d.lineIdx + 1})`).join("\n");
}

function buildPacketPrompt(packet, workload) {
  const blocks = packet.items.map((item) =>
    [`=== FILE: ${item.path} ===`, readForPrompt(item.absPath, workload.file_char_budget), methodList(item)].join("\n")
  );
  return `Classify the following ${packet.items.length} file(s). Return one "files" entry per file, echoing each path exactly.\n\n${blocks.join("\n\n")}`;
}

// Write anchors for one item given the model's fields. Returns a result record.
function applyToItem(item, fileFields, methodsById, dryRun) {
  const methodItems = [];
  let omitted = 0;
  for (const d of item.methodsNeeding) {
    const fields = methodsById.get(d.id);
    if (fields) methodItems.push({ def: d, fields });
    else omitted += 1;
  }
  const fileBlock = item.doFile ? buildAnchorBlock(fileFields || {}, item.deterministic) : null;

  if (dryRun) {
    return { path: item.path, status: "planned", methodPlanned: methodItems.length, omitted, fileBlock };
  }
  let methodsWritten = 0;
  try {
    if (item.doMethods && methodItems.length) methodsWritten = applyMethodAnchors(item.absPath, methodItems);
    if (item.doFile) {
      if (item.fileExisting) replaceAnchor(item.absPath, fileBlock);
      else insertAnchor(item.absPath, fileBlock);
    }
  } catch (error) {
    return { path: item.path, status: "error", reason: error.message, methodsWritten };
  }
  const status = item.doFile ? (item.fileExisting ? "updated" : "anchored") : "methods_only";
  return { path: item.path, status, methodsWritten, omitted };
}

// Oversize single file: classify via repeated method-batched calls (COMBINED prompt).
async function processOversizeFile(item, { apiKey, model, dryRun, workload }) {
  const fileText = readForPrompt(item.absPath, workload.file_char_budget);
  const batches = item.doMethods && item.methodsNeeding.length ? chunk(item.methodsNeeding, workload.method_batch) : [[]];
  let fileFields = {};
  const byId = new Map();
  try {
    for (let b = 0; b < batches.length; b += 1) {
      const includeFile = b === 0 && item.doFile;
      const list = batches[b].length
        ? "METHODS TO ANCHOR (ids):\n" + batches[b].map((d) => `${d.id}: ${d.name} (line ${d.lineIdx + 1})`).join("\n")
        : "METHODS TO ANCHOR: none — return an empty methods array.";
      const note = includeFile ? "" : '\nNOTE: file already anchored; "file" is ignored this call.';
      const parsed = await callGeminiJSON({
        system: COMBINED_SYSTEM_INSTRUCTION,
        user: `FILE PATH: ${item.path}\n\nFILE CONTENT:\n${fileText}\n\n${list}${note}`,
        apiKey,
        model,
        maxTokens: workload.max_output_tokens,
      });
      if (b === 0) fileFields = parsed.file || {};
      for (const m of Array.isArray(parsed.methods) ? parsed.methods : []) byId.set(Number(m.id), m);
    }
  } catch (error) {
    return [{ path: item.path, status: "error", reason: error.message }];
  }
  return [applyToItem(item, fileFields, byId, dryRun)];
}

// Process one packet (one bee request, unless oversize).
async function processPacket(packet, opts) {
  if (packet.oversize) return processOversizeFile(packet.items[0], opts);

  let parsed;
  try {
    parsed = await callGeminiJSON({
      system: PACKET_SYSTEM_INSTRUCTION,
      user: buildPacketPrompt(packet, opts.workload),
      apiKey: opts.apiKey,
      model: opts.model,
      maxTokens: opts.workload.max_output_tokens,
    });
  } catch (error) {
    return packet.items.map((it) => ({ path: it.path, status: "error", reason: error.message }));
  }

  const byPath = new Map((Array.isArray(parsed.files) ? parsed.files : []).map((f) => [f.path, f]));
  const results = [];
  for (const item of packet.items) {
    const entry = byPath.get(item.path);
    if (!entry) {
      results.push({ path: item.path, status: "error", reason: "missing from packet response" });
      continue;
    }
    const methodsById = new Map((Array.isArray(entry.methods) ? entry.methods : []).map((m) => [Number(m.id), m]));
    results.push(applyToItem(item, entry.file || {}, methodsById, opts.dryRun));
  }
  return results;
}

// Run the packet swarm: a small pool of bees pulling packets from a shared queue.
// The packet (its swarm + workload) determines bee count and per-bee weight.
async function runFileSwarm(work, options = {}) {
  const { packet: spec, apiKey, dryRun = false, onProgress } = options;
  const agents = spec.swarm.agents;
  const model = spec.model;
  const workload = spec.workload;
  const packets = packWork(work, workload);
  const tally = { anchored: 0, updated: 0, methods_only: 0, planned: 0, error: 0 };
  let methodsTotal = 0;
  const results = [];
  let cursor = 0;

  async function beeLoop(beeId) {
    while (cursor < packets.length) {
      const index = cursor++;
      const packet = packets[index];
      const packetResults = await processPacket(packet, { apiKey, model, dryRun, workload });
      for (const r of packetResults) {
        if (tally[r.status] !== undefined) tally[r.status] += 1;
        methodsTotal += r.methodsWritten || r.methodPlanned || 0;
        results.push(r);
      }
      if (onProgress) {
        onProgress({ beeId, index, totalPackets: packets.length, packetFiles: packet.items.length, oversize: !!packet.oversize, results: packetResults });
      }
    }
  }

  const pool = [];
  for (let i = 0; i < Math.min(agents, packets.length); i += 1) pool.push(beeLoop(i + 1));
  await Promise.all(pool);

  return { tally, methodsTotal, results, fileCount: work.length, packetCount: packets.length };
}

module.exports = { runFileSwarm, processPacket, packWork };
