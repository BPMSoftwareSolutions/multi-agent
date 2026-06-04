// warehouse:file
// responsibility: CLI delegator: start command orchestrates session creation workflow from validation through persistence and status output
// actor: cli
// role: command_handler
// source_truth: implementation

const { saveSession } = require("../../core/session-store");
const { initializeSession } = require("./session-initializer");
const { validateBrief } = require("./start-validator");
const { exit } = require("../print");

// warehouse:method
// responsibility: Command dispatcher: validates task brief, initializes session with normalized intent, persists to store, outputs session ID and task definition
// actor: cli
// role: command_handler
// source_truth: implementation
async function start(brief, apiKey, options = {}) {
  try {
    validateBrief(brief);
    const session = await initializeSession(brief, apiKey);
    saveSession(session);

    if (options.json) {
      console.log(JSON.stringify({ sessionId: session.id, ok: true }, null, 2));
    } else {
      console.log(`Session started: ${session.id}`);
      console.log(`\nTask: ${session.intent.task_definition}\n`);
    }

    return session;
  } catch (error) {
    exit(2, `Error: ${error.message}`);
  }
}

module.exports = { start };
