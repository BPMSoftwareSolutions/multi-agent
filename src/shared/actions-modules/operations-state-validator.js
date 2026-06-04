// warehouse:file
// responsibility: Validates session operations structure, merges with defaults, ensures correct types
// actor: action_orchestrator
// role: state_validator
// source_truth: implementation

const { buildOperationsState } = require("./operations-builder");

// warehouse:method
// responsibility: Validates session operations structure, merges with defaults, ensures correct types
// actor: method_implementation
// role: implementation
// source_truth: implementation
function ensureOperationsState(session) {
  if (!session.operations || typeof session.operations !== "object") {
    session.operations = buildOperationsState();
    return session.operations;
  }

  const defaults = buildOperationsState();
  session.operations.approvedActions = Array.isArray(session.operations.approvedActions)
    ? session.operations.approvedActions
    : defaults.approvedActions;
  session.operations.actionAttempts = Array.isArray(session.operations.actionAttempts)
    ? session.operations.actionAttempts
    : defaults.actionAttempts;
  session.operations.humanReviewQueue = Array.isArray(session.operations.humanReviewQueue)
    ? session.operations.humanReviewQueue
    : defaults.humanReviewQueue;
  session.operations.driveSyncState = {
    ...defaults.driveSyncState,
    ...(session.operations.driveSyncState || {})
  };
  session.operations.files =
    session.operations.files && typeof session.operations.files === "object"
      ? session.operations.files
      : defaults.files;
  session.operations.folders =
    session.operations.folders && typeof session.operations.folders === "object"
      ? session.operations.folders
      : defaults.folders;

  return session.operations;
}

module.exports = { ensureOperationsState };
