// warehouse:file
// responsibility: Orchestrates start command: validates arguments, initializes session, persists and outputs state
// actor: cli
// role: command_handler
// source_truth: implementation

const { saveSession } = require("../../core/session-store");
const { initializeSession } = require("./session-initializer");
const { validateBrief } = require("./start-validator");
const { exit } = require("../print");

// warehouse:method
// responsibility: Orchestrates session startup: validates brief, initializes session with intent, persists and outputs
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
