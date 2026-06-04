// warehouse:file
// responsibility: Retrieves a single session row from SQL database by session ID
// actor: persistence_layer
// role: session_reader
// source_truth: implementation

const { getSqlConfig, sqlStringLiteral, runSqlJson } = require("../sql-helpers");
const { ensureSchema } = require("./schema-manager");

function getSessionRow(sessionId) {
  ensureSchema();
  const { schema } = getSqlConfig();
  return runSqlJson(`
SET NOCOUNT ON;
SELECT TOP 1
  session_id,
  brief,
  current_stage,
  completed,
  intent_json,
  stages_json,
  operations_json,
  CONVERT(NVARCHAR(50), created_at, 127) AS created_at,
  CONVERT(NVARCHAR(50), updated_at, 127) AS updated_at
FROM ${schema}.sessions
WHERE session_id = ${sqlStringLiteral(sessionId)}
FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
`);
}

module.exports = { getSessionRow };
