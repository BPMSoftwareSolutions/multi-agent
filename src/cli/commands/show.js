// warehouse:file
// responsibility: Handles the show command which displays the current session state including stages and operations
// actor: cli
// role: command_handler
// source_truth: implementation

const { getSession, getCurrentSessionId } = require("../../core/session-store");
const { renderSession, exit } = require("../print");

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
