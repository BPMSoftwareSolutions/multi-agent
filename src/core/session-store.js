// warehouse:file
// responsibility: Persists and retrieves session state including stages, artifacts, and operations from database storage
// actor: core_runtime
// role: session_persistence
// source_truth: implementation

const { v4: uuidv4 } = require("uuid");
const { STAGE_ORDER, createEmptyArtifact } = require("./stages");
const { buildOperationsState, ensureOperationsState } = require("../shared/actions");
const {
  ensureSchema,
  getAppState,
  getSessionRow,
  listSessionRows,
  saveSessionRow,
  setAppState
} = require("../shared/sql-server");

// warehouse:method
// responsibility: Reconstructs session object from database row, parsing JSON fields and ensuring operation state consistency
// actor: core_runtime
// role: session_deserialization
// source_truth: implementation
function deserializeSession(row) {
  if (!row) {
    return null;
  }

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

// warehouse:method
// responsibility: Initializes new session with brief, intent, empty artifact for all stages, and persists to database
// actor: core_runtime
// role: session_creation
// source_truth: implementation
function createSession(brief, intent = null) {
  ensureSchema();

  const sessionId = uuidv4();
  const session = {
    id: sessionId,
    brief,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    currentStage: "idea",
    completed: false,
    intent:
      intent || {
        task_definition: "",
        success_criteria: [],
        constraints: [],
        open_questions: []
      },
    stages: {
      idea: {
        artifact: createEmptyArtifact("idea"),
        proposedArtifact: null,
        accepted: false,
        rounds: []
      },
      ascii: {
        artifact: createEmptyArtifact("ascii"),
        proposedArtifact: null,
        accepted: false,
        rounds: []
      },
      plan: {
        artifact: createEmptyArtifact("plan"),
        proposedArtifact: null,
        accepted: false,
        rounds: []
      }
    },
    operations: buildOperationsState()
  };

  saveSession(session);
  setCurrentSessionId(sessionId);
  return session;
}

// warehouse:method
// responsibility: Retrieves and deserializes session by ID from database
// actor: core_runtime
// role: session_retrieval
// source_truth: implementation
function getSession(sessionId) {
  return deserializeSession(getSessionRow(sessionId));
}

// warehouse:method
// responsibility: Persists session to database, ensuring operation state is valid and updating timestamp
// actor: core_runtime
// role: session_persistence
// source_truth: implementation
function saveSession(session) {
  ensureOperationsState(session);
  if (!session.updatedAt) {
    session.updatedAt = new Date().toISOString();
  }
  saveSessionRow(session);
}

// warehouse:method
// responsibility: Retrieves the current active session ID from application state
// actor: core_runtime
// role: session_context
// source_truth: implementation
function getCurrentSessionId() {
  return getAppState("current_session_id");
}

// warehouse:method
// responsibility: Sets the current active session ID in application state
// actor: core_runtime
// role: session_context
// source_truth: implementation
function setCurrentSessionId(sessionId) {
  setAppState("current_session_id", sessionId || "");
}

// warehouse:method
// responsibility: Lists all session IDs from database
// actor: core_runtime
// role: session_enumeration
// source_truth: implementation
function listSessions() {
  return listSessionRows().map((row) => row.session_id);
}

// warehouse:method
// responsibility: Updates session's modified timestamp and persists, used to track recent activity
// actor: core_runtime
// role: activity_tracking
// source_truth: implementation
function touchSession(sessionId) {
  const session = getSession(sessionId);
  if (!session) {
    return null;
  }

  session.updatedAt = new Date().toISOString();
  saveSession(session);
  return session;
}

module.exports = {
  createSession,
  getSession,
  saveSession,
  getCurrentSessionId,
  setCurrentSessionId,
  listSessions,
  touchSession
};
