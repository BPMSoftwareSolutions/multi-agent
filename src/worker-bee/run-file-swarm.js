// warehouse:file
// responsibility: CLI orchestrator for file-level swarm anchor generation - delegates to focused modules
// actor: worker_bee_infrastructure
// role: entry_point
// source_truth: implementation

const { runFileSwarm } = require("./file-swarm/swarm-orchestrator");
const { processPacket } = require("./file-swarm/anchor-applicator");
const { packWork } = require("./file-swarm/work-packer");

module.exports = { runFileSwarm, processPacket, packWork };
