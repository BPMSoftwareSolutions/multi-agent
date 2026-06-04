// warehouse:file
// responsibility: CLI delegator: show command retrieves session state and renders artifacts, stages, and pending operations for user inspection
// actor: cli
// role: command_handler
// source_truth: implementation

const { getSession, getCurrentSessionId } = require("../../core/session-store");
const { renderSession, exit } = require("../print");

// warehouse:method
// responsibility: Command dispatcher: loads session and renders human-readable state with stages, artifacts, and operation summary
// actor: cli
// role: command_handler
// source_truth: implementation
async function show(sessionId = null, options = {}) {
  try {
    const id = sessionId || options.session || getCurrentSessionId();
    if (!id) {
      exit(1, "Error: No active session. Use 'studio start <brief>' to begin.");
    }

    const session = getSession(id);
    if (!session) {
      exit(1, `Error: Session not found: ${id}`);
    }

    console.log(renderSession(session, options));
  } catch (error) {
    exit(2, `Error: ${error.message}`);
  }
}

module.exports = { show };
