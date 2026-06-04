// warehouse:file
// responsibility: Orchestrates concurrent agents processing file packets and writing anchors via language model APIs
// actor: worker_bee_infrastructure
// role: orchestrator
// source_truth: implementation

const { SYSTEM_INSTRUCTION } = require("../anchor-spec");
const { buildAnchorBlock, insertAnchor, replaceAnchor } = require("../scan");
const { callGeminiJSON } = require("../gemini-client");
const { chunk } = require("./work-chunker");
const { readTruncated } = require("./file-reader");

// warehouse:method
// responsibility: undefined
// actor: undefined
// role: undefined
// source_truth: implementation

function buildUserPrompt(packet) {
  const blocks = packet.map((f) => {
    return `=== FILE: ${f.path} ===\n${readTruncated(f.absPath)}`;
  });
  return (
    `Classify the following ${packet.length} Python file(s). ` +
    `Return one entry per file, echoing each path exactly.\n\n` +
    blocks.join("\n\n")
  );
}

// warehouse:method
// responsibility: undefined
// actor: undefined
// role: undefined
// source_truth: implementation

async function processPacket(packet, { apiKey, model, dryRun }) {
  const byPath = new Map(packet.map((f) => [f.path, f]));
  const results = [];

  let parsed;
  try {
    parsed = await callGeminiJSON({
      system: SYSTEM_INSTRUCTION,
      user: buildUserPrompt(packet),
      apiKey,
      model,
    });
  } catch (error) {
    for (const f of packet) {
      results.push({ path: f.path, status: "error", reason: error.message });
    }
    return results;
  }

  const entries = Array.isArray(parsed?.files) ? parsed.files : [];
  const seen = new Set();
  for (const entry of entries) {
    const f = byPath.get(entry.path);
    if (!f) {
      results.push({ path: entry.path, status: "error", reason: "unknown path in response" });
      continue;
    }
    seen.add(entry.path);
    const block = buildAnchorBlock(entry, {
      expected_location: f.expected_location,
      repo_root_depth: f.repo_root_depth,
    });
    if (dryRun) {
      results.push({ path: f.path, status: "planned", existing: !!f.existing, issues: f.issues, block });
      continue;
    }
    try {
      if (f.existing) {
        replaceAnchor(f.absPath, block);
        results.push({ path: f.path, status: "updated", issues: f.issues, block });
      } else {
        const wrote = insertAnchor(f.absPath, block);
        results.push({ path: f.path, status: wrote ? "anchored" : "skipped", block });
      }
    } catch (error) {
      results.push({ path: f.path, status: "error", reason: error.message });
    }
  }

  for (const f of packet) {
    if (!seen.has(f.path)) {
      results.push({ path: f.path, status: "error", reason: "missing from model response" });
    }
  }
  return results;
}

// warehouse:method
// responsibility: undefined
// actor: undefined
// role: undefined
// source_truth: implementation

async function runSwarm(missing, options = {}) {
  const {
    agents = 6,
    filesPerPacket = 4,
    apiKey,
    model,
    dryRun = false,
    onProgress,
  } = options;

  const packets = chunk(missing, filesPerPacket);
  const queue = packets.map((p, i) => ({ index: i, packet: p }));
  const tally = { anchored: 0, updated: 0, skipped: 0, planned: 0, error: 0 };
  const allResults = [];
  let cursor = 0;

  async function agentLoop(agentId) {
    while (true) {
      const item = cursor < queue.length ? queue[cursor++] : null;
      if (!item) break;
      const results = await processPacket(item.packet, { apiKey, model, dryRun });
      for (const r of results) {
        if (tally[r.status] !== undefined) tally[r.status] += 1;
        allResults.push(r);
      }
      if (onProgress) {
        onProgress({ agentId, index: item.index, totalPackets: queue.length, results });
      }
    }
  }

  const pool = [];
  for (let i = 0; i < Math.min(agents, queue.length); i += 1) pool.push(agentLoop(i + 1));
  await Promise.all(pool);

  return { tally, results: allResults };
}

module.exports = { buildUserPrompt, processPacket, runSwarm };
