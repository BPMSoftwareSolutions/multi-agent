// warehouse:file
// responsibility: Retrieves individual sessions and lists all session IDs from database
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

module.exports = { getSession, listSessions };
