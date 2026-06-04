// warehouse:file
// responsibility: Coordinates getCurrentSessionId and setCurrentSessionId behavior with documented file and method taxonomy evidence
// actor: core_runtime
// role: session_context
// source_truth: implementation

const { getAppState, setAppState } = require("../../shared/sql-server");

// warehouse:method
// responsibility: Coordinates getCurrentSessionId and setCurrentSessionId behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function getCurrentSessionId() {
  return getAppState("current_session_id");
}

// warehouse:method
// responsibility: Coordinates getCurrentSessionId and setCurrentSessionId behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function setCurrentSessionId(sessionId) {
  setAppState("current_session_id", sessionId || "");
}

module.exports = { getCurrentSessionId, setCurrentSessionId };
