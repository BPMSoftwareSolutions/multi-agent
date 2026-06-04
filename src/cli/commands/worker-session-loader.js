// warehouse:file
// responsibility: Loads and validates worker session for command execution with error handling and context resolution
// actor: cli
// role: session_loader
// source_truth: implementation

const { getSession, getCurrentSessionId } = require("../../core/session-store");
const { exit } = require("../print");

// warehouse:method
// responsibility: Resolves session ID from options or current context, returns session or exits with error
// actor: method_implementation
// role: implementation
// source_truth: implementation
function loadWorkerSession(options = {}) {
  const sessionId = options.sessionId || options.session || getCurrentSessionId();
  if (!sessionId) {
    exit(1, "Error: No active session. Use 'studio start <brief>' to begin.");
  }

  const session = getSession(sessionId);
  if (!session) {
    exit(1, `Error: Session not found: ${sessionId}`);
  }

  return session;
}

module.exports = { loadWorkerSession };
