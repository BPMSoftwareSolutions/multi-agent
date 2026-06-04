// warehouse:file
// responsibility: Delegator: re-exports session saver, getter, and lister for backward compatibility
// actor: shared
// role: session_persistence
// source_truth: implementation

const { saveSessionRow } = require("./session-saver");
const { getSessionRow } = require("./session-row-getter");
const { listSessionRows } = require("./session-lister");

module.exports = { saveSessionRow, getSessionRow, listSessionRows };
