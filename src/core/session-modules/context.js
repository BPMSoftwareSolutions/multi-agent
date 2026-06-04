// warehouse:file
// responsibility: Manages current session context state
// actor: core_runtime
// role: session_context
// source_truth: implementation

const { getAppState, setAppState } = require("../../shared/sql-server");

function getCurrentSessionId() {
  return getAppState("current_session_id");
}

function setCurrentSessionId(sessionId) {
  setAppState("current_session_id", sessionId || "");
}

module.exports = { getCurrentSessionId, setCurrentSessionId };
