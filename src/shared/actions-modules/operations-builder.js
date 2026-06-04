// warehouse:file
// responsibility: Initializes and validates operations state
// actor: shared
// role: state_initializer, state_validator
// source_truth: implementation

// warehouse:method
// responsibility: Initializes operations state with empty action queues, sync state, and file/folder registries
// actor: shared
// role: state_initializer
// source_truth: implementation
function buildOperationsState() {
  return {
    approvedActions: [],
    actionAttempts: [],
    humanReviewQueue: [],
    driveSyncState: {
      scopeId: "default",
      provider: null,
      rootFolderId: null,
      rootPath: null,
      lastStartPageToken: null,
      lastPolledAt: null
    },
    files: {},
    folders: {}
  };
}

// warehouse:method
// responsibility: Ensures session has valid operations state, merges with defaults, and validates array/object types
// actor: shared
// role: state_validator
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

module.exports = {
  buildOperationsState,
  ensureOperationsState
};
