// warehouse:file
// responsibility: Resolves session ID (from parameter or current) and retrieves session object
// actor: cli
// role: accessor
// source_truth: implementation

const { getSession, getCurrentSessionId } = require("../../core/session-store");

// warehouse:method
// responsibility: Resolves session ID (from parameter or current) and retrieves session object
// actor: method_implementation
// role: implementation
// source_truth: implementation
function lookupSession(sessionId = null) {
  const id = sessionId || getCurrentSessionId();
  if (!id) {
    throw new Error("No active session. Use 'studio start <brief>' to begin.");
  }

  const session = getSession(id);
  if (!session) {
    throw new Error(`Session not found: ${id}`);
  }

  return session;
}

module.exports = { lookupSession };
