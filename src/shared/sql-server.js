// warehouse:file
// responsibility: SQL Server persistence aggregator - delegates to focused modules for sessions, app state, OAuth tokens, and schema management
// actor: shared
// role: persistence_entry_point
// source_truth: implementation

const { ensureSchema } = require("./sql-modules/schema-manager");
const { saveSessionRow, getSessionRow, listSessionRows } = require("./sql-modules/session-store");
const { setAppState, getAppState } = require("./sql-modules/app-state-store");
const { setOAuthToken, getOAuthToken } = require("./sql-modules/oauth-token-store");
const { getSqlConfig, sqlStringLiteral, buildSqlcmdArgs, runSql, runSqlJson } = require("./sql-helpers");

module.exports = {
  ensureSchema,
  getAppState,
  getOAuthToken,
  getSessionRow,
  getSqlConfig,
  listSessionRows,
  runSql,
  saveSessionRow,
  setAppState,
  setOAuthToken,
  sqlStringLiteral,
  buildSqlcmdArgs,
  runSqlJson,
};
