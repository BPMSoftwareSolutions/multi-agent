// warehouse:file
// responsibility: Delegates to focused session modules for creation, retrieval, and persistence
// actor: core_runtime
// role: entry_point
// source_truth: implementation

const { createSession } = require("./session-modules/creator");
const { getSession, listSessions } = require("./session-modules/retriever");
const { saveSession } = require("./session-modules/persister");
const { touchSession } = require("./session-modules/touch");
const { getCurrentSessionId, setCurrentSessionId } = require("./session-modules/context");

module.exports = { createSession, getSession, saveSession, getCurrentSessionId, setCurrentSessionId, listSessions, touchSession };
