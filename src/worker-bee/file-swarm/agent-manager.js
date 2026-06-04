// warehouse:file
// responsibility: Creates and orchestrates concurrent bee workers that pull packets from shared queue and process them
// actor: worker_bee_infrastructure
// role: agent_pool_manager
// source_truth: implementation

const { processPacket } = require("./anchor-applicator");

// warehouse:method
// responsibility: Creates and orchestrates concurrent bee workers that pull packets from shared queue and process them
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function createBeePool(packets, spec, apiKey, dryRun, onProgress) {
  const model = spec.model;
  const workload = spec.workload;
  const agents = spec.swarm.agents;

  const tally = { anchored: 0, updated: 0, methods_only: 0, planned: 0, error: 0 };
  let methodsTotal = 0;
  const results = [];
  let cursor = 0;

// warehouse:method
// responsibility: Creates and orchestrates concurrent bee workers that pull packets from shared queue and process them
// actor: method_implementation
// role: implementation
// source_truth: implementation
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

  return { tally, methodsTotal, results };
}

module.exports = { createBeePool };
