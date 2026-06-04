// warehouse:file
// responsibility: Retrieves OAuth tokens from SQL database by provider
// actor: persistence_layer
// role: token_reader
// source_truth: implementation

const { getSqlConfig, sqlStringLiteral, runSqlJson } = require("../sql-helpers");
const { ensureSchema } = require("./schema-manager");

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

module.exports = { getOAuthToken };
