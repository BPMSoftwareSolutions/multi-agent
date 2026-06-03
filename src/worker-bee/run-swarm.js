// Worker-bee swarm orchestrator.
//
// Takes the list of files missing anchors, chunks them into packets, and runs a
// pool of N concurrent "agents". Each agent pulls the next packet from a shared
// queue, sends it to Gemini in one call, and writes the returned anchors back.

const fs = require("fs");
const { SYSTEM_INSTRUCTION } = require("./anchor-spec");
const { buildAnchorBlock, insertAnchor, replaceAnchor } = require("./scan");
const { callGeminiJSON } = require("./gemini-client");

const CHARS_PER_FILE = 6000; // truncate big files so packets stay within budget

function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function readTruncated(absPath) {
  let text;
  try {
    text = fs.readFileSync(absPath, "utf8");
  } catch (_e) {
    return "";
  }
  if (text.length <= CHARS_PER_FILE) return text;
  return text.slice(0, CHARS_PER_FILE) + "\n# ...[truncated for classification]...";
}

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

// Process a single packet: classify with Gemini, write anchors. Returns per-file
// outcomes so the caller can tally results.
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

  // Any file the model omitted.
  for (const f of packet) {
    if (!seen.has(f.path)) {
      results.push({ path: f.path, status: "error", reason: "missing from model response" });
    }
  }
  return results;
}

// Run the swarm. Options: agents (concurrency), filesPerPacket, apiKey, model,
// dryRun, onProgress(callback per finished packet).
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
        onProgress({
          agentId,
          packetIndex: item.index,
          totalPackets: packets.length,
          results,
        });
      }
    }
  }

  const pool = [];
  for (let i = 0; i < Math.min(agents, queue.length); i += 1) {
    pool.push(agentLoop(i + 1));
  }
  await Promise.all(pool);

  return { tally, results: allResults, packetCount: packets.length };
}

module.exports = { runSwarm, processPacket, chunk };
