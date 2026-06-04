// warehouse:file
// responsibility: Delegates session persistence operations to focused modules
// actor: shared
// role: orchestrator
// source_truth: implementation

const { saveSessionRow } = require("./session-saver");
const { getSessionRow, listSessionRows } = require("./session-retriever");

module.exports = { saveSessionRow, getSessionRow, listSessionRows };
