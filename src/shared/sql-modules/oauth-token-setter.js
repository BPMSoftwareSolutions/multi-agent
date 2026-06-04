// warehouse:file
// responsibility: Persists OAuth tokens to SQL database by provider
// actor: persistence_layer
// role: token_writer
// source_truth: implementation

const { getSqlConfig, sqlStringLiteral, runSql } = require("../sql-helpers");
const { ensureSchema } = require("./schema-manager");

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

module.exports = { setOAuthToken };
