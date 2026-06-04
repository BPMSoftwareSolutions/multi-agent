// warehouse:file
// responsibility: Initializes session with brief and normalized intent from input
// actor: cli
// role: initializer
// source_truth: implementation

const { createSession } = require("../../core/session-store");
const { normalizeIntent } = require("../../core/run-round");

// warehouse:method
// responsibility: Initializes session with brief and normalized intent from input — function
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function initializeSession(brief, apiKey) {
  const session = createSession(brief);
  const intent = await normalizeIntent(brief, apiKey);
  session.intent = intent;
  return session;
}

module.exports = { initializeSession };
