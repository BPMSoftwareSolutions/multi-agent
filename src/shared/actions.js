// warehouse:file
// responsibility: Provides action queuing, approval workflow, and worker execution for file operations across the system
// actor: shared
// role: action_handler
// source_truth: implementation

const { v4: uuidv4 } = require("uuid");

const ACTION_TYPES = new Set([
  "rename",
  "move",
  "add_tag",
  "mark_duplicate",
  "archive_candidate"
]);

const APPROVAL_STATUSES = new Set(["approved", "needs_human_review", "rejected"]);

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

// warehouse:method
// responsibility: Normalizes value to trimmed string or null, used for safe value coercion
// actor: shared
// role: string_normalizer
// source_truth: implementation
function toTrimmedString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

// warehouse:method
// responsibility: Normalizes value to array of trimmed strings, filters empty items, used for tags and similar lists
// actor: shared
// role: array_normalizer
// source_truth: implementation
function toStringArray(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
}

// warehouse:method
// responsibility: Validates and normalizes approval status to approved, needs_human_review, or rejected; defaults to approved
// actor: shared
// role: approval_status_normalizer
// source_truth: implementation
function normalizeApprovalStatus(value) {
  const normalized = toTrimmedString(value);
  if (normalized && APPROVAL_STATUSES.has(normalized)) {
    return normalized;
  }
  return "approved";
}

// warehouse:method
// responsibility: Validates and normalizes risk level to low, medium, or high; defaults to medium
// actor: shared
// role: risk_level_normalizer
// source_truth: implementation
function normalizeRiskLevel(value) {
  const normalized = toTrimmedString(value);
  if (["low", "medium", "high"].includes(normalized)) {
    return normalized;
  }
  return "medium";
}

// warehouse:method
// responsibility: Normalizes action recommendation input, validates fields, assigns defaults for ids, creates idempotency key based on action identity
// actor: shared
// role: recommendation_normalizer
// source_truth: implementation
function normalizeActionRecommendation(input, context = {}) {
  if (!input || typeof input !== "object") {
    return null;
  }

  const actionType = toTrimmedString(input.action_type || input.actionType);
  if (!actionType || !ACTION_TYPES.has(actionType)) {
    return null;
  }

  const fileId =
    toTrimmedString(input.file_id || input.fileId) ||
    toTrimmedString(input.item_id || input.itemId) ||
    `file_${uuidv4()}`;

  const itemId =
    toTrimmedString(input.item_id || input.itemId) ||
    toTrimmedString(input.file_id || input.fileId) ||
    fileId;

  const currentParentId =
    toTrimmedString(input.current_parent_id || input.currentParentId) || "inbox";
  const currentName = toTrimmedString(input.current_name || input.currentName) || fileId;
  const expectedRevision = Number(input.expected_revision || input.expectedRevision || 1);

  return {
    recommendationId:
      toTrimmedString(input.recommendation_id || input.recommendationId) || `rec_${uuidv4()}`,
    itemId,
    fileId,
    provider: toTrimmedString(input.provider) || null,
    actionType,
    approvalStatus: normalizeApprovalStatus(input.approval_status || input.approvalStatus),
    approvedBy:
      toTrimmedString(input.approved_by || input.approvedBy) ||
      context.approvedBy ||
      "reviewer+rules",
    rationale: toTrimmedString(input.rationale) || "",
    riskLevel: normalizeRiskLevel(input.risk_level || input.riskLevel),
    currentParentId,
    currentName,
    targetParentId: toTrimmedString(input.target_parent_id || input.targetParentId),
    newName: toTrimmedString(input.new_name || input.newName),
    tags: toStringArray(input.tags),
    expectedRevision: Number.isFinite(expectedRevision) && expectedRevision > 0 ? expectedRevision : 1,
    idempotencyKey:
      toTrimmedString(input.idempotency_key || input.idempotencyKey) ||
      `${context.sessionId || "session"}-${itemId}-${actionType}-${context.stageId || "stage"}-${context.roundNumber || 0}`
  };
}

// warehouse:method
// responsibility: Registers folder in operations state with metadata and current timestamp
// actor: shared
// role: folder_registrar
// source_truth: implementation
function registerFolder(operations, folderId) {
  if (!folderId) {
    return;
  }

  operations.folders[folderId] = {
    ...(operations.folders[folderId] || {}),
    folderId,
    exists: true,
    updatedAt: new Date().toISOString()
  };
}

// warehouse:method
// responsibility: Registers file in operations state from recommendation, merges with existing metadata, registers parent folders
// actor: shared
// role: file_registrar
// source_truth: implementation
function registerFileFromRecommendation(operations, recommendation) {
  const existing = operations.files[recommendation.fileId] || null;
  const permissions = {
    canMove: true,
    canRename: true,
    canTag: true,
    canArchive: true,
    ...(existing && existing.permissions ? existing.permissions : {})
  };

  operations.files[recommendation.fileId] = {
    fileId: recommendation.fileId,
    itemId: recommendation.itemId,
    provider: recommendation.provider || (existing ? existing.provider : "simulated"),
    name: existing ? existing.name : recommendation.currentName,
    parentId: existing ? existing.parentId : recommendation.currentParentId,
    exists: existing ? existing.exists !== false : true,
    permissions,
    revision: existing ? existing.revision : recommendation.expectedRevision,
    tags: existing && Array.isArray(existing.tags) ? existing.tags : [],
    duplicate: existing ? !!existing.duplicate : false,
    archived: existing ? !!existing.archived : false,
    updatedAt: new Date().toISOString()
  };

  registerFolder(operations, recommendation.currentParentId);
  registerFolder(operations, recommendation.targetParentId);
}

// warehouse:method
// responsibility: Creates human review queue item from recommendation, checks for duplicates, adds to queue with generated review id
// actor: shared
// role: human_review_queuer
// source_truth: implementation
function queueHumanReviewItem(operations, recommendation, context = {}) {
  const existing = operations.humanReviewQueue.find(
    (item) => item.recommendationId === recommendation.recommendationId
  );
  if (existing) {
    return existing;
  }

  const queueItem = {
    reviewId: `review_${uuidv4()}`,
    recommendationId: recommendation.recommendationId,
    itemId: recommendation.itemId,
    fileId: recommendation.fileId,
    reason:
      recommendation.rationale ||
      `Recommendation ${recommendation.recommendationId} requires human review.`,
    riskLevel: recommendation.riskLevel,
    blockedActionId: null,
    stageId: context.stageId || null,
    roundNumber: context.roundNumber || null,
    createdAt: new Date().toISOString()
  };

  operations.humanReviewQueue.push(queueItem);
  return queueItem;
}

// warehouse:method
// responsibility: Processes array of recommendations, normalizes each, registers files/folders, queues approved actions or human reviews, returns summary
// actor: shared
// role: action_queuer
// source_truth: implementation
function queueActionRecommendations(session, recommendations, context = {}) {
  const operations = ensureOperationsState(session);
  const summary = {
    enqueued: 0,
    duplicates: 0,
    humanReview: 0,
    rejected: 0,
    invalid: 0,
    actionIds: []
  };

  const normalizedRecommendations = Array.isArray(recommendations) ? recommendations : [];
  normalizedRecommendations.forEach((recommendationInput) => {
    const recommendation = normalizeActionRecommendation(recommendationInput, {
      ...context,
      sessionId: session.id
    });

    if (!recommendation) {
      summary.invalid += 1;
      return;
    }

    registerFileFromRecommendation(operations, recommendation);

    if (recommendation.approvalStatus === "rejected") {
      summary.rejected += 1;
      return;
    }

    if (recommendation.approvalStatus === "needs_human_review") {
      queueHumanReviewItem(operations, recommendation, context);
      summary.humanReview += 1;
      return;
    }

    const existing = operations.approvedActions.find(
      (action) => action.idempotencyKey === recommendation.idempotencyKey
    );

    if (existing) {
      summary.duplicates += 1;
      summary.actionIds.push(existing.actionId);
      return;
    }

    const now = new Date().toISOString();
    const action = {
      actionId: `act_${uuidv4()}`,
      recommendationId: recommendation.recommendationId,
      itemId: recommendation.itemId,
      sessionId: session.id,
      stageId: context.stageId || null,
      roundNumber: context.roundNumber || null,
      fileId: recommendation.fileId,
      provider: recommendation.provider || (operations.files[recommendation.fileId]?.provider || null),
      approvedAction: recommendation.actionType,
      actionType: recommendation.actionType,
      targetParentId: recommendation.targetParentId,
      newName: recommendation.newName,
      tags: recommendation.tags,
      approvalStatus: recommendation.approvalStatus,
      approvedBy: recommendation.approvedBy,
      rationale: recommendation.rationale,
      riskLevel: recommendation.riskLevel,
      status: "pending",
      idempotencyKey: recommendation.idempotencyKey,
      expectedState: {
        parentId: recommendation.currentParentId,
        name: recommendation.currentName,
        revision: recommendation.expectedRevision
      },
      approvedAt: now,
      updatedAt: now,
      lastError: null,
      result: null
    };

    operations.approvedActions.push(action);
    summary.enqueued += 1;
    summary.actionIds.push(action.actionId);
  });

  return summary;
}

// warehouse:method
// responsibility: Wraps single recommendation as array and queues it, enabling manual approval workflow from CLI
// actor: shared
// role: manual_action_approver
// source_truth: implementation
function approveManualAction(session, recommendationInput, context = {}) {
  return queueActionRecommendations(session, [recommendationInput], context);
}

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
  ACTION_TYPES,
  buildOperationsState,
  ensureOperationsState,
  normalizeActionRecommendation,
  approveManualAction,
  queueActionRecommendations,
  runWorker,
  summarizeOperations
};