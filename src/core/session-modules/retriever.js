// warehouse:file
// responsibility: Retrieves and lists sessions from database
// actor: core_runtime
// role: session_retriever
// source_truth: implementation

const { getSessionRow, listSessionRows } = require("../../shared/sql-server");
const { deserializeSession } = require("./deserializer");

function getSession(sessionId) {
  return deserializeSession(getSessionRow(sessionId));
}

function listSessions() {
  return listSessionRows().map((row) => row.session_id);
}

function touchSession(sessionId) {
  const session = getSession(sessionId);
  if (!session) return null;
  session.updatedAt = new Date().toISOString();
  const { saveSession } = require("./persister");
  saveSession(session);
  return session;
}

module.exports = { getSession, listSessions, touchSession };
