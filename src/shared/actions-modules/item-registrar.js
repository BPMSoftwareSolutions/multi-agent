// warehouse:file
// responsibility: Registers folder in operations state with metadata and current timestamp
// actor: method_implementation
// role: implementation
// source_truth: implementation

// warehouse:method
// responsibility: Registers folder in operations state with metadata and current timestamp
// actor: method_implementation
// role: implementation
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
// actor: method_implementation
// role: implementation
// source_truth: implementation
function registerFile(operations, recommendation) {
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

module.exports = {
  registerFolder,
  registerFile
};
