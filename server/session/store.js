const coreStore = require("../../src/core/session-store");

function createSession(brief, intent) {
  return coreStore.createSession(brief, intent);
}

function getSession(id) {
  return coreStore.getSession(id);
}

function updateSession(id, patch) {
  const session = coreStore.getSession(id);
  if (!session) {
    return null;
  }

  Object.assign(session, patch, { updatedAt: new Date().toISOString() });
  coreStore.saveSession(session);
  return session;
}

function touchSession(id) {
  return coreStore.touchSession(id);
}

module.exports = {
  createSession,
  getSession,
  updateSession,
  touchSession
};
