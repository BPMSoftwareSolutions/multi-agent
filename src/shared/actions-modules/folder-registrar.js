// warehouse:file
// responsibility: Records folder in state with exists flag and timestamp
// actor: method_implementation
// role: implementation
// source_truth: implementation

// warehouse:method
// responsibility: Records folder in state with exists flag and timestamp
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

module.exports = { registerFolder };
