// warehouse:file
// responsibility: CLI aggregator for file-level swarm anchor classification - delegates to focused swarm modules
// actor: worker_bee_infrastructure
// role: entry_point
// source_truth: implementation

const { buildUserPrompt, processPacket, runSwarm } = require("./file-swarms/swarm-orchestrator");

module.exports = { runSwarm, processPacket, buildUserPrompt };
