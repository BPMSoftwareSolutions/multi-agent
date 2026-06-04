// warehouse:file
// responsibility: Orchestrates concurrent bee agents processing packets from shared work queue
// actor: worker_bee_infrastructure
// role: orchestrator
// source_truth: implementation

const { packWork } = require("./work-packer");
const { processPacket } = require("./anchor-applicator");

// warehouse:method
// responsibility: Orchestrates concurrent bee agents pulling packets from queue and writing anchors
// actor: worker_bee_infrastructure
// role: orchestrator
// source_truth: implementation
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

module.exports = { runFileSwarm };
