// warehouse:file
// responsibility: Handles the start command which creates a new session with a brief and initializes the workflow intent
// actor: cli
// role: command_handler
// source_truth: implementation

const { createSession } = require("../../core/session-store");
const { normalizeIntent } = require("../../core/run-round");
const { renderSession, exit } = require("../print");

async function start(brief, apiKey, options = {}) {
  if (!brief || typeof brief !== "string") {
    exit(1, "Error: brief is required and must be a string");
  }

  try {
    const session = createSession(brief);
    const intent = await normalizeIntent(brief, apiKey);
    session.intent = intent;

    const store = require("../../core/session-store");
    store.saveSession(session);

    if (options.json) {
      console.log(JSON.stringify({ sessionId: session.id, ok: true }, null, 2));
    } else {
      console.log(`Session started: ${session.id}`);
      console.log(`\nTask: ${intent.task_definition}\n`);
    }

    return session;
  } catch (error) {
    exit(2, `Error: ${error.message}`);
  }
}

module.exports = { start };
