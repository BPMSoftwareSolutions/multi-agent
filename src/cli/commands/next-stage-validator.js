// warehouse:file
// responsibility: Validates session state and stage readiness for next-stage command execution
// actor: cli
// role: validator
// source_truth: implementation

const { getSession, getCurrentSessionId } = require("../../core/session-store");
const { exit } = require("../print");

// warehouse:method
// responsibility: undefined
// actor: undefined
// role: undefined
// source_truth: implementation

function validateNextStage(sessionId = null) {
  const id = sessionId || getCurrentSessionId();
  if (!id) {
    exit(1, "Error: No active session. Use 'studio start <brief>' to begin.");
  }

  const session = getSession(id);
  if (!session) {
    exit(1, `Error: Session not found: ${id}`);
  }

  return { id, session };
}

module.exports = { validateNextStage };
