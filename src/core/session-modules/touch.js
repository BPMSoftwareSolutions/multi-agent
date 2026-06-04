// warehouse:file
// responsibility: Updates session timestamp and persists the updated state
// actor: core_runtime
// role: session_touch
// source_truth: implementation

const { getSession } = require("./retriever");
const { saveSession } = require("./persister");

function touchSession(sessionId) {
  const session = getSession(sessionId);
  if (!session) return null;
  session.updatedAt = new Date().toISOString();
  saveSession(session);
  return session;
}

module.exports = { touchSession };
