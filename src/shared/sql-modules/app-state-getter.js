// warehouse:file
// responsibility: Retrieves application state values from SQL Server database by key
// actor: shared
// role: app_state_getter
// source_truth: implementation

const { getSqlConfig, sqlStringLiteral, runSqlJson } = require("../sql-helpers");
const { ensureSchema } = require("./schema-manager");

// warehouse:method
// responsibility: Retrieves application state value from SQL database by key, returns value or null if not found
// actor: shared
// role: app_state_getter
// source_truth: implementation
function getAppState(stateKey) {
  ensureSchema();
  const { schema } = getSqlConfig();
  const row = runSqlJson(`
SET NOCOUNT ON;
SELECT TOP 1 state_key, state_value
FROM ${schema}.app_state
WHERE state_key = ${sqlStringLiteral(stateKey)}
FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
`);
  return row ? row.state_value : null;
}

module.exports = { getAppState };
