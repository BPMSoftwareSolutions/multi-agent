// warehouse:file
// responsibility: Coordinates saveSession behavior with documented file and method taxonomy evidence
// actor: core_runtime
// role: session_persister
// source_truth: implementation

const { ensureOperationsState } = require("../../shared/actions");
const { saveSessionRow } = require("../../shared/sql-server");

// warehouse:method
// responsibility: Coordinates saveSession behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function saveSession(session) {
  ensureOperationsState(session);
  if (!session.updatedAt) {
    session.updatedAt = new Date().toISOString();
  }
  saveSessionRow(session);
}

module.exports = { saveSession };
