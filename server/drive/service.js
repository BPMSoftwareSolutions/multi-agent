// warehouse:file
// responsibility: Coordinates escapeDriveQueryValue and normalizeDrivePermissions and updateDriveFileState and updateDriveFolderState and listFolderChildren and sanitizeDrivePath and resolveDrivePath and importDriveFolderToSession and getDriveFileMetadata and executeDriveWorker and fail behavior with documented file and method taxonomy evidence
// actor: server_runtime
// role: runtime_component
// source_truth: implementation

const { ensureOperationsState } = require("../../src/shared/actions");
const { getAuthorizedDrive } = require("./client");

const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";

// warehouse:method
// responsibility: Coordinates escapeDriveQueryValue and normalizeDrivePermissions and updateDriveFileState and updateDriveFolderState and listFolderChildren and sanitizeDrivePath and resolveDrivePath and importDriveFolderToSession and getDriveFileMetadata and executeDriveWorker and fail behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function escapeDriveQueryValue(value) {
  return String(value || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

// warehouse:method
// responsibility: Coordinates escapeDriveQueryValue and normalizeDrivePermissions and updateDriveFileState and updateDriveFolderState and listFolderChildren and sanitizeDrivePath and resolveDrivePath and importDriveFolderToSession and getDriveFileMetadata and executeDriveWorker and fail behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function normalizeDrivePermissions(capabilities = {}) {
  return {
    canMove: Boolean(
      capabilities.canMoveItemWithinDrive ||
        capabilities.canMoveItemWithinTeamDrive ||
        capabilities.canEdit
    ),
    canRename: Boolean(capabilities.canRename || capabilities.canEdit),
    canTag: true,
    canArchive: true
  };
}

// warehouse:method
// responsibility: Coordinates escapeDriveQueryValue and normalizeDrivePermissions and updateDriveFileState and updateDriveFolderState and listFolderChildren and sanitizeDrivePath and resolveDrivePath and importDriveFolderToSession and getDriveFileMetadata and executeDriveWorker and fail behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function updateDriveFileState(operations, file) {
  operations.files[file.id] = {
    ...(operations.files[file.id] || {}),
    fileId: file.id,
    itemId: file.id,
    provider: "google-drive",
    name: file.name,
    parentId: Array.isArray(file.parents) && file.parents.length ? file.parents[0] : null,
    exists: !file.trashed,
    permissions: normalizeDrivePermissions(file.capabilities || {}),
    revision: Number(file.version || operations.files[file.id]?.revision || 1),
    tags: Array.isArray(operations.files[file.id]?.tags) ? operations.files[file.id].tags : [],
    duplicate: Boolean(operations.files[file.id]?.duplicate),
    archived: Boolean(operations.files[file.id]?.archived),
    mimeType: file.mimeType,
    driveId: file.driveId || null,
    webViewLink: file.webViewLink || null,
    modifiedTime: file.modifiedTime || null,
    updatedAt: new Date().toISOString()
  };
}

// warehouse:method
// responsibility: Coordinates escapeDriveQueryValue and normalizeDrivePermissions and updateDriveFileState and updateDriveFolderState and listFolderChildren and sanitizeDrivePath and resolveDrivePath and importDriveFolderToSession and getDriveFileMetadata and executeDriveWorker and fail behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function updateDriveFolderState(operations, folder) {
  operations.folders[folder.id] = {
    ...(operations.folders[folder.id] || {}),
    folderId: folder.id,
    provider: "google-drive",
    name: folder.name,
    parentId: Array.isArray(folder.parents) && folder.parents.length ? folder.parents[0] : null,
    driveId: folder.driveId || null,
    webViewLink: folder.webViewLink || null,
    exists: !folder.trashed,
    updatedAt: new Date().toISOString()
  };
}

// warehouse:method
// responsibility: Coordinates escapeDriveQueryValue and normalizeDrivePermissions and updateDriveFileState and updateDriveFolderState and listFolderChildren and sanitizeDrivePath and resolveDrivePath and importDriveFolderToSession and getDriveFileMetadata and executeDriveWorker and fail behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function listFolderChildren(folderId = "root", pageSize = 200) {
  const { drive } = await getAuthorizedDrive();
  const files = [];
  let pageToken;

  do {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      orderBy: "folder,name_natural",
      pageSize,
      pageToken,
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
      fields:
        "nextPageToken, files(id,name,mimeType,parents,driveId,webViewLink,version,modifiedTime,trashed,capabilities)"
    });

    files.push(...(response.data.files || []));
    pageToken = response.data.nextPageToken || undefined;
  } while (pageToken);

  return files;
}

// warehouse:method
// responsibility: Coordinates escapeDriveQueryValue and normalizeDrivePermissions and updateDriveFileState and updateDriveFolderState and listFolderChildren and sanitizeDrivePath and resolveDrivePath and importDriveFolderToSession and getDriveFileMetadata and executeDriveWorker and fail behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function sanitizeDrivePath(inputPath) {
  const normalized = String(inputPath || "").trim().replace(/[\\]+/g, "/");
  const myDriveIndex = normalized.toLowerCase().indexOf("my drive/");
  const relative = myDriveIndex >= 0 ? normalized.slice(myDriveIndex + "my drive/".length) : normalized;
  return relative
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
}

// warehouse:method
// responsibility: Coordinates escapeDriveQueryValue and normalizeDrivePermissions and updateDriveFileState and updateDriveFolderState and listFolderChildren and sanitizeDrivePath and resolveDrivePath and importDriveFolderToSession and getDriveFileMetadata and executeDriveWorker and fail behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function resolveDrivePath(inputPath) {
  const segments = sanitizeDrivePath(inputPath);
  const { drive } = await getAuthorizedDrive();

  if (!segments.length) {
    return {
      folderId: "root",
      name: "My Drive",
      resolvedSegments: []
    };
  }

  let parentId = "root";
  const resolvedSegments = [];

  for (const segment of segments) {
    const response = await drive.files.list({
      q: `'${parentId}' in parents and trashed = false and mimeType = '${FOLDER_MIME_TYPE}' and name = '${escapeDriveQueryValue(segment)}'`,
      pageSize: 10,
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
      fields: "files(id,name,mimeType,parents,driveId,webViewLink,trashed,capabilities)"
    });

    const match = (response.data.files || [])[0];
    if (!match) {
      const error = new Error(`Could not resolve Drive path segment: ${segment}`);
      error.status = 404;
      throw error;
    }

    parentId = match.id;
    resolvedSegments.push({
      id: match.id,
      name: match.name,
      webViewLink: match.webViewLink || null,
      driveId: match.driveId || null
    });
  }

  return {
    folderId: parentId,
    name: resolvedSegments[resolvedSegments.length - 1].name,
    resolvedSegments
  };
}

// warehouse:method
// responsibility: Coordinates escapeDriveQueryValue and normalizeDrivePermissions and updateDriveFileState and updateDriveFolderState and listFolderChildren and sanitizeDrivePath and resolveDrivePath and importDriveFolderToSession and getDriveFileMetadata and executeDriveWorker and fail behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function importDriveFolderToSession(session, { folderId, drivePath = null, maxDepth = 4, maxItems = 500 }) {
  const operations = ensureOperationsState(session);
  const { drive } = await getAuthorizedDrive();
  const queue = [{ folderId, depth: 0 }];
  let folderCount = 0;
  let fileCount = 0;

  while (queue.length && fileCount + folderCount < maxItems) {
    const current = queue.shift();
    const children = await listFolderChildren(current.folderId);

    children.forEach((child) => {
      if (child.mimeType === FOLDER_MIME_TYPE) {
        updateDriveFolderState(operations, child);
        folderCount += 1;
        if (current.depth < maxDepth) {
          queue.push({ folderId: child.id, depth: current.depth + 1 });
        }
        return;
      }

      updateDriveFileState(operations, child);
      fileCount += 1;
    });
  }

  let lastStartPageToken = null;
  try {
    const tokenResponse = await drive.changes.getStartPageToken({ supportsAllDrives: true });
    lastStartPageToken = tokenResponse.data.startPageToken || null;
  } catch {
    lastStartPageToken = null;
  }

  operations.driveSyncState = {
    ...operations.driveSyncState,
    provider: "google-drive",
    scopeId: folderId,
    rootFolderId: folderId,
    rootPath: drivePath,
    lastStartPageToken,
    lastPolledAt: new Date().toISOString()
  };

  return {
    folderId,
    importedFiles: fileCount,
    importedFolders: folderCount,
    maxDepth,
    maxItems,
    lastStartPageToken
  };
}

// warehouse:method
// responsibility: Coordinates escapeDriveQueryValue and normalizeDrivePermissions and updateDriveFileState and updateDriveFolderState and listFolderChildren and sanitizeDrivePath and resolveDrivePath and importDriveFolderToSession and getDriveFileMetadata and executeDriveWorker and fail behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function getDriveFileMetadata(fileId) {
  const { drive } = await getAuthorizedDrive();
  const response = await drive.files.get({
    fileId,
    supportsAllDrives: true,
    fields:
      "id,name,mimeType,parents,driveId,webViewLink,version,modifiedTime,trashed,capabilities"
  });
  return response.data;
}

// warehouse:method
// responsibility: Coordinates escapeDriveQueryValue and normalizeDrivePermissions and updateDriveFileState and updateDriveFolderState and listFolderChildren and sanitizeDrivePath and resolveDrivePath and importDriveFolderToSession and getDriveFileMetadata and executeDriveWorker and fail behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function executeDriveWorker(session, { actionId, actor = "drive_worker" }) {
  const operations = ensureOperationsState(session);
  const action = actionId
    ? operations.approvedActions.find((entry) => entry.actionId === actionId)
    : operations.approvedActions.find((entry) => entry.status === "pending");

  if (!action) {
    return {
      ok: false,
      code: actionId ? "action_not_found" : "no_pending_actions",
      message: actionId
        ? `Approved action not found: ${actionId}`
        : "No pending approved actions found."
    };
  }

  const currentState = operations.files[action.fileId] || null;
  if (!currentState || currentState.provider !== "google-drive") {
    return {
      ok: false,
      code: "not_drive_action",
      message: `Action ${action.actionId} is not backed by Google Drive state.`
    };
  }

  action.status = "running";
  action.updatedAt = new Date().toISOString();
  const attempt = {
    attemptId: `attempt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    actionId: action.actionId,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    requestJson: {
      actor,
      action,
      fileBefore: JSON.parse(JSON.stringify(currentState))
    },
    responseJson: null,
    errorCode: null,
    errorMessage: null
  };

// warehouse:method
// responsibility: Coordinates escapeDriveQueryValue and normalizeDrivePermissions and updateDriveFileState and updateDriveFolderState and listFolderChildren and sanitizeDrivePath and resolveDrivePath and importDriveFolderToSession and getDriveFileMetadata and executeDriveWorker and fail behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
  const fail = (code, message, status = "failed") => {
    const finishedAt = new Date().toISOString();
    action.status = status;
    action.updatedAt = finishedAt;
    action.lastError = { code, message, at: finishedAt };
    attempt.finishedAt = finishedAt;
    attempt.errorCode = code;
    attempt.errorMessage = message;
    attempt.responseJson = { ok: false, code, message };
    operations.actionAttempts.push(attempt);
    return { ok: false, code, message, action, attempt };
  };

  let metadata;
  try {
    metadata = await getDriveFileMetadata(action.fileId);
  } catch (error) {
    const status = Number(error.code || error.status || error.response?.status || 500);
    if (status === 404) {
      return fail("file_missing", `Drive file ${action.fileId} no longer exists.`);
    }
    return fail("drive_read_failed", error.message || "Failed to read Drive file metadata.");
  }

  if (metadata.trashed) {
    return fail("file_missing", `Drive file ${action.fileId} is trashed.`);
  }

  const currentParentId = Array.isArray(metadata.parents) && metadata.parents.length ? metadata.parents[0] : null;
  if (action.expectedState.parentId && currentParentId !== action.expectedState.parentId) {
    return fail(
      "stale_parent",
      `Drive file ${action.fileId} moved since approval. Expected parent ${action.expectedState.parentId}, found ${currentParentId}.`,
      "blocked"
    );
  }

  const currentRevision = Number(metadata.version || 0);
  if (action.expectedState.revision && currentRevision !== Number(action.expectedState.revision)) {
    return fail("stale_revision", `Drive file ${action.fileId} changed since approval.`, "blocked");
  }

  const { drive } = await getAuthorizedDrive();
  let finalMetadata = metadata;

  try {
    if (action.actionType === "rename") {
      if (!action.newName) {
        return fail("missing_new_name", `Rename action ${action.actionId} has no new name.`);
      }
      if (!metadata.capabilities?.canRename && !metadata.capabilities?.canEdit) {
        return fail("permission_denied", `Drive file ${action.fileId} cannot be renamed.`);
      }

      const response = await drive.files.update({
        fileId: action.fileId,
        supportsAllDrives: true,
        requestBody: { name: action.newName },
        fields:
          "id,name,mimeType,parents,driveId,webViewLink,version,modifiedTime,trashed,capabilities"
      });
      finalMetadata = response.data;
    }

    if (action.actionType === "move") {
      if (!action.targetParentId) {
        return fail("missing_target_parent", `Move action ${action.actionId} has no target parent.`);
      }
      if (
        !metadata.capabilities?.canMoveItemWithinDrive &&
        !metadata.capabilities?.canMoveItemWithinTeamDrive &&
        !metadata.capabilities?.canEdit
      ) {
        return fail("permission_denied", `Drive file ${action.fileId} cannot be moved.`);
      }

      const removeParents = Array.isArray(metadata.parents) ? metadata.parents.join(",") : undefined;
      const response = await drive.files.update({
        fileId: action.fileId,
        addParents: action.targetParentId,
        removeParents,
        supportsAllDrives: true,
        fields:
          "id,name,mimeType,parents,driveId,webViewLink,version,modifiedTime,trashed,capabilities"
      });
      finalMetadata = response.data;
    }

    if (action.actionType === "add_tag") {
      currentState.tags = Array.from(new Set([...(currentState.tags || []), ...(action.tags || [])]));
    }

    if (action.actionType === "mark_duplicate") {
      currentState.duplicate = true;
    }

    if (action.actionType === "archive_candidate") {
      currentState.archived = true;
    }
  } catch (error) {
    return fail("drive_update_failed", error.message || "Drive update failed.");
  }

  updateDriveFileState(operations, finalMetadata);
  if (currentState.tags) {
    operations.files[action.fileId].tags = currentState.tags;
  }
  if (currentState.duplicate) {
    operations.files[action.fileId].duplicate = true;
  }
  if (currentState.archived) {
    operations.files[action.fileId].archived = true;
  }

  const finishedAt = new Date().toISOString();
  action.status = "done";
  action.updatedAt = finishedAt;
  action.lastError = null;
  action.result = {
    executedBy: actor,
    executedAt: finishedAt,
    fileAfter: JSON.parse(JSON.stringify(operations.files[action.fileId]))
  };
  attempt.finishedAt = finishedAt;
  attempt.responseJson = {
    ok: true,
    actionId: action.actionId,
    fileAfter: JSON.parse(JSON.stringify(operations.files[action.fileId]))
  };
  operations.actionAttempts.push(attempt);
  operations.driveSyncState.lastPolledAt = finishedAt;

  return {
    ok: true,
    code: "executed",
    message: `Action ${action.actionId} executed successfully against Google Drive.`,
    action,
    attempt,
    file: operations.files[action.fileId]
  };
}

module.exports = {
  executeDriveWorker,
  importDriveFolderToSession,
  listFolderChildren,
  resolveDrivePath
};