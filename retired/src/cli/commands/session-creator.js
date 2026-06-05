// warehouse:file
// responsibility: Creates and persists new session with brief and intent
// actor: cli
// role: factory
// source_truth: implementation

const { createSession, saveSession } = require("../../core/session-store");

// warehouse:method
// responsibility: Creates and persists new session with brief and intent
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function createAndSaveSession(brief, intent = null) {
  const session = createSession(brief);
  if (intent) {
    session.intent = intent;
  }
  saveSession(session);
  return session;
}

module.exports = { createAndSaveSession };
