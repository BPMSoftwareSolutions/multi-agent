// warehouse:file
// responsibility: Applicator: applies anchors to single file item via language model API, returns status with written count and Applicator: processes oversized file with adaptive packet splitting via batched language model calls with retry logic and Applicator: processes packet via language model API with adaptive splitting and retry logic on failures
// actor: worker_bee_infrastructure
// role: applicator
// source_truth: implementation

const { PACKET_SYSTEM_INSTRUCTION, COMBINED_SYSTEM_INSTRUCTION } = require("../anchor-spec");
const { buildAnchorBlock, insertAnchor, replaceAnchor } = require("../scan");
const { applyMethodAnchors } = require("../methods");
const { callGeminiJSON } = require("../gemini-client");
const { buildPacketPrompt } = require("./prompt-builder");
const { chunk } = require("./work-packer");

// warehouse:method
// responsibility: Applicator: applies anchors to single file item via language model API, returns status with written count and Applicator: processes oversized file with adaptive packet splitting via batched language model calls with retry logic and Applicator: processes packet via language model API with adaptive splitting and retry logic on failures
// actor: method_implementation
// role: implementation
// source_truth: implementation
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

// warehouse:method
// responsibility: Applicator: applies anchors to single file item via language model API, returns status with written count and Applicator: processes oversized file with adaptive packet splitting via batched language model calls with retry logic and Applicator: processes packet via language model API with adaptive splitting and retry logic on failures
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function processOversizeFile(item, { apiKey, model, dryRun, workload }) {
  const { readForPrompt } = require("./file-reader");
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

// warehouse:method
// responsibility: Applicator: applies anchors to single file item via language model API, returns status with written count and Applicator: processes oversized file with adaptive packet splitting via batched language model calls with retry logic and Applicator: processes packet via language model API with adaptive splitting and retry logic on failures
// actor: method_implementation
// role: implementation
// source_truth: implementation
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
    if (packet.items.length > 1) {
      const mid = Math.ceil(packet.items.length / 2);
      const left = await processPacket({ items: packet.items.slice(0, mid) }, opts);
      const right = await processPacket({ items: packet.items.slice(mid) }, opts);
      return [...left, ...right];
    }
    return packet.items.map((it) => ({ path: it.path, status: "error", reason: error.message }));
  }

  const byPath = new Map((Array.isArray(parsed.files) ? parsed.files : []).map((f) => [f.path, f]));
  const results = [];
  const missing = [];
  for (const item of packet.items) {
    const entry = byPath.get(item.path);
    if (!entry) {
      missing.push(item);
      continue;
    }
    const methodsById = new Map((Array.isArray(entry.methods) ? entry.methods : []).map((m) => [Number(m.id), m]));
    results.push(applyToItem(item, entry.file || {}, methodsById, opts.dryRun));
  }

  if (missing.length) {
    if (missing.length === packet.items.length) {
      if (packet.items.length > 1) {
        const mid = Math.ceil(packet.items.length / 2);
        const left = await processPacket({ items: packet.items.slice(0, mid) }, opts);
        const right = await processPacket({ items: packet.items.slice(mid) }, opts);
        return [...left, ...right];
      }
      results.push({ path: missing[0].path, status: "error", reason: "missing from packet response" });
    } else {
      const retried = await processPacket({ items: missing }, opts);
      results.push(...retried);
    }
  }
  return results;
}

module.exports = { applyToItem, processOversizeFile, processPacket };
