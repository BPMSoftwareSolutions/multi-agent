// warehouse:file
// responsibility: Processes work packets and aggregates results with file count tracking
// actor: worker_bee_infrastructure
// role: result_aggregator
// source_truth: implementation

const { packWork } = require("./work-packer");

// warehouse:method
// responsibility: Packs work into packets and computes file/packet counts for metrics
// actor: method_implementation
// role: implementation
// source_truth: implementation
function prepareWorkPackets(work, workload) {
  const packets = packWork(work, workload);
  return {
    packets,
    packetCount: packets.length,
    fileCount: work.length
  };
}

module.exports = { prepareWorkPackets };
