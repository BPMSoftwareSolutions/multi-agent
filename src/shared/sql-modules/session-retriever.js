// warehouse:file
// responsibility: Retrieves session objects from SQL Server database by ID or lists all
// actor: shared
// role: session_reader
// source_truth: implementation

const { getSqlConfig, sqlStringLiteral, runSqlJson } = require("../sql-helpers");
const { ensureSchema } = require("./schema-manager");

// warehouse:method
// responsibility: Retrieves session from database by ID and converts to JSON object
// actor: shared
// role: session_reader
// source_truth: implementation
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

// warehouse:method
// responsibility: Lists all sessions from database ordered by creation date descending
// actor: shared
// role: session_reader
// source_truth: implementation
function listSessionRows() {
  ensureSchema();
  const { schema } = getSqlConfig();
  return (
    runSqlJson(`
SET NOCOUNT ON;
SELECT
  session_id,
  CONVERT(NVARCHAR(50), created_at, 127) AS created_at
FROM ${schema}.sessions
ORDER BY created_at DESC
FOR JSON PATH;
`) || []
  );
}

module.exports = { getSessionRow, listSessionRows };
