// warehouse:file
// responsibility: Session store aggregator - delegates to focused modules for creation, retrieval, persistence, and context management
// actor: core_runtime
// role: entry_point
// source_truth: implementation

const { createSession } = require("./session-modules/creator");
const { getSession, listSessions, touchSession } = require("./session-modules/retriever");
const { saveSession } = require("./session-modules/persister");
const { getCurrentSessionId, setCurrentSessionId } = require("./session-modules/context");

module.exports = { createSession, getSession, saveSession, getCurrentSessionId, setCurrentSessionId, listSessions, touchSession };
