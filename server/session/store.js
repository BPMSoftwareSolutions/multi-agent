// warehouse:file
// responsibility: Coordinates createSession and getSession and updateSession and touchSession behavior with documented file and method taxonomy evidence
// actor: server_runtime
// role: runtime_component
// source_truth: implementation

const coreStore = require("../../src/core/session-store");

// warehouse:method
// responsibility: Coordinates createSession and getSession and updateSession and touchSession behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function createSession(brief, intent) {
  return coreStore.createSession(brief, intent);
}

// warehouse:method
// responsibility: Coordinates createSession and getSession and updateSession and touchSession behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function getSession(id) {
  return coreStore.getSession(id);
}

// warehouse:method
// responsibility: Coordinates createSession and getSession and updateSession and touchSession behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function updateSession(id, patch) {
  const session = coreStore.getSession(id);
  if (!session) {
    return null;
  }

  Object.assign(session, patch, { updatedAt: new Date().toISOString() });
  coreStore.saveSession(session);
  return session;
}

// warehouse:method
// responsibility: Coordinates createSession and getSession and updateSession and touchSession behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function touchSession(id) {
  return coreStore.touchSession(id);
}

module.exports = {
  createSession,
  getSession,
  updateSession,
  touchSession
};
