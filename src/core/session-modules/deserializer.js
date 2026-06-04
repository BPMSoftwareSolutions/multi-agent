// warehouse:file
// responsibility: Deserializes session objects from database rows
// actor: core_runtime
// role: session_deserializer
// source_truth: implementation

const { buildOperationsState, ensureOperationsState } = require("../../shared/actions");

function deserializeSession(row) {
  if (!row) return null;
  const session = {
    id: row.session_id,
    brief: row.brief,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    currentStage: row.current_stage,
    completed: Boolean(row.completed),
    intent: row.intent_json ? JSON.parse(row.intent_json) : {},
    stages: row.stages_json ? JSON.parse(row.stages_json) : {},
    operations: row.operations_json ? JSON.parse(row.operations_json) : buildOperationsState()
  };
  ensureOperationsState(session);
  return session;
}

module.exports = { deserializeSession };
