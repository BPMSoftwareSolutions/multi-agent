// warehouse:file
// responsibility: Coordinates touchSession behavior with documented file and method taxonomy evidence
// actor: core_runtime
// role: session_touch
// source_truth: implementation

const { getSession } = require("./retriever");
const { saveSession } = require("./persister");

// warehouse:method
// responsibility: Coordinates touchSession behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function touchSession(sessionId) {
  const session = getSession(sessionId);
  if (!session) return null;
  session.updatedAt = new Date().toISOString();
  saveSession(session);
  return session;
}

module.exports = { touchSession };
