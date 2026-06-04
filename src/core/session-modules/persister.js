// warehouse:file
// responsibility: Persists sessions to database
// actor: core_runtime
// role: session_persister
// source_truth: implementation

const { ensureOperationsState } = require("../../shared/actions");
const { saveSessionRow } = require("../../shared/sql-server");

function saveSession(session) {
  ensureOperationsState(session);
  if (!session.updatedAt) {
    session.updatedAt = new Date().toISOString();
  }
  saveSessionRow(session);
}

module.exports = { saveSession };
