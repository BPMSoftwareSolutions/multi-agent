// warehouse:file
// responsibility: Session initializer: creates new session and embeds normalized intent for design workshop tracking
// actor: cli
// role: session_factory
// source_truth: implementation

const { createSession } = require("../../core/session-store");
const { normalizeIntent } = require("../../core/run-round");

// warehouse:method
// responsibility: Session factory: creates session with intent normalization for coherence tracking and artifact state management
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
