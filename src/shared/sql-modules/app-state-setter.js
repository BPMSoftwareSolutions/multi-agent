// warehouse:file
// responsibility: Persists application state values to SQL Server database using MERGE operations
// actor: shared
// role: app_state_setter
// source_truth: implementation

const { getSqlConfig, sqlStringLiteral, runSql } = require("../sql-helpers");
const { ensureSchema } = require("./schema-manager");

// warehouse:method
// responsibility: Persists application state value to SQL database by key with MERGE create-or-update semantics and timestamp
// actor: shared
// role: app_state_setter
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

module.exports = { setAppState };
