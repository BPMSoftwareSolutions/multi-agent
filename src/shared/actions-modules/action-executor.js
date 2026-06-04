// warehouse:file
// responsibility: Executes pending actions with file validation, applies mutations, logs attempts
// actor: action_orchestrator
// role: executor
// source_truth: implementation

const { runWorker, failAttempt } = require("./action-runner");
const { summarizeOperations } = require("./result-handler");

module.exports = {
  runWorker,
  failAttempt,
  summarizeOperations
};
