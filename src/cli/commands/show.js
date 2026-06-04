// warehouse:file
// responsibility: Show command handler: retrieves current session, renders complete state including stages and operations, outputs formatted state
// actor: cli
// role: command_handler
// source_truth: implementation

const { getSession, getCurrentSessionId } = require("../../core/session-store");
const { renderSession, exit } = require("../print");

// warehouse:method
// responsibility: Retrieves session by id, formats complete state using renderer, and logs to stdout
// actor: cli
// role: show_command
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
