// warehouse:file
// responsibility: Coordinates getSession and listSessions behavior with documented file and method taxonomy evidence
// actor: core_runtime
// role: session_retriever
// source_truth: implementation

const { getSessionRow, listSessionRows } = require("../../shared/sql-server");
const { deserializeSession } = require("./deserializer");

// warehouse:method
// responsibility: Coordinates getSession and listSessions behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function getSession(sessionId) {
  return deserializeSession(getSessionRow(sessionId));
}

// warehouse:method
// responsibility: Coordinates getSession and listSessions behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function listSessions() {
  return listSessionRows().map((row) => row.session_id);
}

module.exports = { getSession, listSessions };
