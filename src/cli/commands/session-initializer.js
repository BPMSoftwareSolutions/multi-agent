// warehouse:file
// responsibility: Initializes session with brief and normalized intent
// actor: cli
// role: session_factory
// source_truth: implementation

const { createSession } = require("../../core/session-store");
const { normalizeIntent } = require("../../core/run-round");

// warehouse:method
// responsibility: Creates new session and normalizes intent from brief
// actor: cli
// role: session_factory
// source_truth: implementation
async function initializeSession(brief, apiKey) {
  const session = createSession(brief);
  const intent = await normalizeIntent(brief, apiKey);
  session.intent = intent;
  return session;
}

module.exports = { initializeSession };
