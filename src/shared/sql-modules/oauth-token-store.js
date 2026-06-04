// warehouse:file
// responsibility: Persists and retrieves OAuth tokens from SQL Server database by provider
// actor: persistence_layer
// role: token_store
// source_truth: implementation

const { getSqlConfig, sqlStringLiteral, runSql, runSqlJson } = require("../sql-helpers");
const { ensureSchema } = require("./schema-manager");

// warehouse:method
// responsibility: Persists and retrieves OAuth tokens: writes token JSON to database by provider using MERGE
// actor: method_implementation
// role: implementation
// source_truth: implementation
function setOAuthToken(provider, tokenJson) {
  ensureSchema();
  const { schema } = getSqlConfig();
  runSql(`
SET NOCOUNT ON;
MERGE ${schema}.oauth_tokens AS target
USING (
  SELECT
    ${sqlStringLiteral(provider)} AS provider,
    ${sqlStringLiteral(tokenJson)} AS token_json,
    SYSUTCDATETIME() AS updated_at
) AS source
ON target.provider = source.provider
WHEN MATCHED THEN UPDATE SET
  token_json = source.token_json,
  updated_at = source.updated_at
WHEN NOT MATCHED THEN INSERT (provider, token_json, updated_at)
VALUES (source.provider, source.token_json, source.updated_at);
`);
}

// warehouse:method
// responsibility: undefined
// actor: undefined
// role: undefined
// source_truth: implementation

function getOAuthToken(provider) {
  ensureSchema();
  const { schema } = getSqlConfig();
  const row = runSqlJson(`
SET NOCOUNT ON;
SELECT TOP 1 provider, token_json
FROM ${schema}.oauth_tokens
WHERE provider = ${sqlStringLiteral(provider)}
FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
`);
  return row ? row.token_json : null;
}

module.exports = { setOAuthToken, getOAuthToken };
