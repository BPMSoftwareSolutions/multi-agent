// warehouse:file
// responsibility: Executes pending actions with file validation and mutation logging
// actor: action_orchestrator
// role: executor
// source_truth: implementation

// Re-export runner and handlers from their single-responsibility modules
const { runWorker } = require("./action-runner");
const { failAttempt } = require("./action-attempt-failure-logger");
const { summarizeOperations } = require("./operations-summarizer");

module.exports = {
  runWorker,
  failAttempt,
  summarizeOperations
};
