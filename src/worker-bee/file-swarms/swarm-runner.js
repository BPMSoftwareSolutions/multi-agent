// warehouse:file
// responsibility: Orchestrates concurrent agents processing file packets with language model APIs from shared queue
// actor: worker_bee_infrastructure
// role: orchestrator
// source_truth: implementation

const { chunk } = require("./work-chunker");
const { processPacket } = require("./packet-processor");

// warehouse:method
// responsibility: Orchestrates concurrent agents processing file packets with language model APIs from shared queue
// actor: method_implementation
// role: implementation
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

module.exports = { runSwarm };
