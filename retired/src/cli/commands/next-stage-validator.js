// warehouse:file
// responsibility: Validates session exists and is retrievable; returns resolved ID
// actor: cli
// role: validator
// source_truth: implementation

const { getSession, getCurrentSessionId } = require("../../core/session-store");

// warehouse:method
// responsibility: Validates session exists and is retrievable; returns resolved ID
// actor: method_implementation
// role: implementation
// source_truth: implementation
function validateNextStage(sessionId = null) {
  const id = sessionId || getCurrentSessionId();
  if (!id) {
    throw new Error("No active session. Use 'studio start <brief>' to begin.");
  }

  const session = getSession(id);
  if (!session) {
    throw new Error(`Session not found: ${id}`);
  }

  return { id, session };
}

module.exports = { validateNextStage };
