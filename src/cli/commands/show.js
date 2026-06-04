// warehouse:file
// responsibility: Show command handler: retrieves session and renders complete state
// actor: cli
// role: orchestrator
// source_truth: implementation

const { lookupSession } = require("./session-lookup");
const { renderSession, exit } = require("../print");

// warehouse:method
// responsibility: Orchestrates session lookup and renders full session state
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function show(sessionId = null, options = {}) {
  try {
    const session = lookupSession(sessionId);
    console.log(renderSession(session, options));
  } catch (error) {
    exit(2, `Error: ${error.message}`);
  }
}

module.exports = { show };
