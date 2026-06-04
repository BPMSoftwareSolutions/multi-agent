// warehouse:file
// responsibility: Creates empty operations object: action queues, sync state, file/folder dicts
// actor: method_implementation
// role: implementation
// source_truth: implementation

// warehouse:method
// responsibility: Creates empty operations object: action queues, sync state, file/folder dicts
// actor: method_implementation
// role: implementation
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

module.exports = { buildOperationsState };
