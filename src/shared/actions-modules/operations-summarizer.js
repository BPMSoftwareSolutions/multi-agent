// warehouse:file
// responsibility: Aggregates action execution counts by status, returns metrics
// actor: action_orchestrator
// role: summarizer
// source_truth: implementation

const { ensureOperationsState } = require("./operations-builder");

// warehouse:method
// responsibility: Aggregates action execution counts by status, returns metrics
// actor: method_implementation
// role: implementation
// source_truth: implementation
function summarizeOperations(session) {
  const operations = ensureOperationsState(session);
  const actions = operations.approvedActions;

  return {
    approvedActions: actions.length,
    pendingActions: actions.filter((action) => action.status === "pending").length,
    runningActions: actions.filter((action) => action.status === "running").length,
    doneActions: actions.filter((action) => action.status === "done").length,
    failedActions: actions.filter((action) => action.status === "failed").length,
    blockedActions: actions.filter((action) => action.status === "blocked").length,
    humanReviewItems: operations.humanReviewQueue.length,
    attempts: operations.actionAttempts.length,
    lastPolledAt: operations.driveSyncState.lastPolledAt || null
  };
}

module.exports = { summarizeOperations };
