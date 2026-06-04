// warehouse:file
// responsibility: Delegator: re-exports session row getter and lister for backward compatibility
// actor: persistence_layer
// role: data_retriever
// source_truth: implementation

const { getSessionRow } = require("./session-row-getter");
const { listSessionRows } = require("./session-lister");

module.exports = { getSessionRow, listSessionRows };
