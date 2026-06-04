// warehouse:file
// responsibility: Delegates swarm execution to focused modules for prompt building, packet processing, and orchestration
// actor: worker_bee_infrastructure
// role: facade
// source_truth: implementation

const { buildUserPrompt } = require("./prompt-builder");
const { processPacket } = require("./packet-processor");
const { runSwarm } = require("./swarm-runner");

module.exports = { buildUserPrompt, processPacket, runSwarm };
