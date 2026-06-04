// warehouse:file
// responsibility: Aggregates bee agent management and packet processing for swarm execution
// actor: worker_bee_infrastructure
// role: orchestrator
// source_truth: implementation

const { createBeePool } = require("./agent-manager");
const { prepareWorkPackets } = require("./packet-processor");

// warehouse:method
// responsibility: Orchestrates complete swarm: packs work into packets, creates bee agent pool, aggregates tally and results
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function runFileSwarm(work, options = {}) {
  const { packet: spec, apiKey, dryRun = false, onProgress } = options;
  const workload = spec.workload;

  const { packets, packetCount, fileCount } = prepareWorkPackets(work, workload);
  const { tally, methodsTotal, results } = await createBeePool(packets, spec, apiKey, dryRun, onProgress);

  return { tally, methodsTotal, results, fileCount, packetCount };
}

module.exports = { runFileSwarm };
