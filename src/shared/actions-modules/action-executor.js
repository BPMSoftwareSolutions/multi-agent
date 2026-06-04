// warehouse:file
// responsibility: Executes actions and summarizes operations
// actor: shared
// role: worker_executor, attempt_failure_handler, operations_summarizer
// source_truth: implementation

const { v4: uuidv4 } = require("uuid");
const { toTrimmedString } = require("../validation-helpers");
const { ensureOperationsState } = require("./operations-builder");

// warehouse:method
// responsibility: Marks action as failed or blocked, records error details in attempt object, pushes to action attempts log
// actor: shared
// role: attempt_failure_handler
// source_truth: implementation
function failAttempt({ operations, action, attempt, code, message, status = "failed" }) {
  const finishedAt = new Date().toISOString();
  action.status = status;
  action.updatedAt = finishedAt;
  action.lastError = {
    code,
    message,
    at: finishedAt
  };
  attempt.finishedAt = finishedAt;
  attempt.errorCode = code;
  attempt.errorMessage = message;
  attempt.responseJson = { ok: false, code, message };
  operations.actionAttempts.push(attempt);

  return {
    ok: false,
    code,
    message,
    action,
    attempt
  };
}

// warehouse:method
// responsibility: Executes pending action, validates file and state, applies action mutations, records attempt, manages external service callbacks
// actor: shared
// role: worker_executor
// source_truth: implementation
async function runWorker(session, options = {}) {
  const operations = ensureOperationsState(session);
  const now = new Date().toISOString();
  const actor = toTrimmedString(options.actor) || "worker";

  const action = options.actionId
    ? operations.approvedActions.find((entry) => entry.actionId === options.actionId)
    : operations.approvedActions.find((entry) => entry.status === "pending");

  if (!action) {
    return {
      ok: false,
      code: options.actionId ? "action_not_found" : "no_pending_actions",
      message: options.actionId
        ? `Approved action not found: ${options.actionId}`
        : "No pending approved actions found."
    };
  }

  if (action.status === "done") {
    return {
      ok: true,
      code: "already_done",
      message: `Action ${action.actionId} is already complete.`,
      action
    };
  }

  action.status = "running";
  action.updatedAt = now;

  const file = operations.files[action.fileId] || null;
  const fileBefore = file ? JSON.parse(JSON.stringify(file)) : null;
  const attempt = {
    attemptId: `attempt_${uuidv4()}`,
    actionId: action.actionId,
    startedAt: now,
    finishedAt: null,
    requestJson: {
      actor,
      action: {
        actionId: action.actionId,
        actionType: action.actionType,
        fileId: action.fileId,
        targetParentId: action.targetParentId,
        newName: action.newName,
        tags: action.tags,
        expectedState: action.expectedState
      },
      fileBefore
    },
    responseJson: null,
    errorCode: null,
    errorMessage: null
  };

  if (file && file.provider === "google-drive") {
    if (typeof options.executeExternalAction !== "function") {
      return failAttempt({
        operations,
        action,
        attempt,
        code: "external_executor_missing",
        message: `No Google Drive executor is configured for action ${action.actionId}.`,
        status: "failed"
      });
    }

    return options.executeExternalAction({
      session,
      operations,
      action,
      attempt,
      actor
    });
  }

  if (!file || file.exists === false) {
    return failAttempt({
      operations,
      action,
      attempt,
      code: "file_missing",
      message: `File ${action.fileId} does not exist.`,
      status: "failed"
    });
  }

  if (
    action.expectedState.parentId &&
    file.parentId &&
    action.expectedState.parentId !== file.parentId
  ) {
    return failAttempt({
      operations,
      action,
      attempt,
      code: "stale_parent",
      message: `File ${action.fileId} moved since approval. Expected parent ${action.expectedState.parentId}, found ${file.parentId}.`,
      status: "blocked"
    });
  }

  if (
    action.expectedState.revision &&
    Number(file.revision || 0) !== Number(action.expectedState.revision)
  ) {
    return failAttempt({
      operations,
      action,
      attempt,
      code: "stale_revision",
      message: `File ${action.fileId} changed since approval.`,
      status: "blocked"
    });
  }

  if (action.actionType === "move") {
    if (!action.targetParentId) {
      return failAttempt({
        operations,
        action,
        attempt,
        code: "missing_target_parent",
        message: `Move action ${action.actionId} has no target parent.`,
        status: "failed"
      });
    }
    if (!operations.folders[action.targetParentId] || operations.folders[action.targetParentId].exists === false) {
      return failAttempt({
        operations,
        action,
        attempt,
        code: "target_missing",
        message: `Target folder ${action.targetParentId} does not exist.`,
        status: "failed"
      });
    }
    if (!file.permissions.canMove) {
      return failAttempt({
        operations,
        action,
        attempt,
        code: "permission_denied",
        message: `File ${action.fileId} cannot be moved.`,
        status: "failed"
      });
    }
    file.parentId = action.targetParentId;
  }

  if (action.actionType === "rename") {
    if (!action.newName) {
      return failAttempt({
        operations,
        action,
        attempt,
        code: "missing_new_name",
        message: `Rename action ${action.actionId} has no new name.`,
        status: "failed"
      });
    }
    if (!file.permissions.canRename) {
      return failAttempt({
        operations,
        action,
        attempt,
        code: "permission_denied",
        message: `File ${action.fileId} cannot be renamed.`,
        status: "failed"
      });
    }
    file.name = action.newName;
  }

  if (action.actionType === "add_tag") {
    if (!file.permissions.canTag) {
      return failAttempt({
        operations,
        action,
        attempt,
        code: "permission_denied",
        message: `File ${action.fileId} cannot be tagged.`,
        status: "failed"
      });
    }
    file.tags = Array.from(new Set([...(file.tags || []), ...(action.tags || [])]));
  }

  if (action.actionType === "mark_duplicate") {
    file.duplicate = true;
  }

  if (action.actionType === "archive_candidate") {
    if (!file.permissions.canArchive) {
      return failAttempt({
        operations,
        action,
        attempt,
        code: "permission_denied",
        message: `File ${action.fileId} cannot be marked for archive.`,
        status: "failed"
      });
    }
    file.archived = true;
  }

  file.revision = Number(file.revision || 0) + 1;
  file.updatedAt = new Date().toISOString();

  const finishedAt = new Date().toISOString();
  action.status = "done";
  action.updatedAt = finishedAt;
  action.lastError = null;
  action.result = {
    executedBy: actor,
    executedAt: finishedAt,
    fileAfter: JSON.parse(JSON.stringify(file))
  };
  attempt.finishedAt = finishedAt;
  attempt.responseJson = {
    ok: true,
    actionId: action.actionId,
    fileAfter: JSON.parse(JSON.stringify(file))
  };
  operations.actionAttempts.push(attempt);
  operations.driveSyncState.lastPolledAt = finishedAt;
  operations.driveSyncState.lastStartPageToken = `token_${Date.now()}`;

  return {
    ok: true,
    code: "executed",
    message: `Action ${action.actionId} executed successfully.`,
    action,
    attempt,
    file
  };
}

// warehouse:method
// responsibility: Aggregates operation counts by status (pending, running, done, failed, blocked), returns summary with human review and attempt counts
// actor: shared
// role: operations_summarizer
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

module.exports = {
  runWorker,
  failAttempt,
  summarizeOperations
};
