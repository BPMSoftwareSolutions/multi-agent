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

function getSession(sessionId) {
  return deserializeSession(getSessionRow(sessionId));
}

function saveSession(session) {
  ensureOperationsState(session);
  if (!session.updatedAt) {
    session.updatedAt = new Date().toISOString();
  }
  saveSessionRow(session);
}

function getCurrentSessionId() {
  return getAppState("current_session_id");
}

function setCurrentSessionId(sessionId) {
  setAppState("current_session_id", sessionId || "");
}

function listSessions() {
  return listSessionRows().map((row) => row.session_id);
}

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
