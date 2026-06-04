// warehouse:file
// responsibility: Persists and retrieves application state values from SQL Server database
// actor: shared
// role: app_state_persistence
// source_truth: implementation

const { getSqlConfig, sqlStringLiteral, runSql, runSqlJson } = require("../sql-helpers");
const { ensureSchema } = require("./schema-manager");

// warehouse:method
// responsibility: Persists application state value to SQL database using MERGE statement, creating or updating row by key with timestamp
// actor: method_implementation
// role: implementation
// source_truth: implementation
function setAppState(stateKey, stateValue) {
  ensureSchema();
  const { schema } = getSqlConfig();
  runSql(`
SET NOCOUNT ON;
MERGE ${schema}.app_state AS target
USING (
  SELECT
    ${sqlStringLiteral(stateKey)} AS state_key,
    ${sqlStringLiteral(stateValue)} AS state_value,
    SYSUTCDATETIME() AS updated_at
) AS source
ON target.state_key = source.state_key
WHEN MATCHED THEN UPDATE SET
  state_value = source.state_value,
  updated_at = source.updated_at
WHEN NOT MATCHED THEN INSERT (state_key, state_value, updated_at)
VALUES (source.state_key, source.state_value, source.updated_at);
`);
}

// warehouse:method
// responsibility: Retrieves application state value from SQL database by key, returns persisted value or null if not found
// actor: method_implementation
// role: implementation
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

module.exports = { setAppState, getAppState };
