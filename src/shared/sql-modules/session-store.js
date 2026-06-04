// warehouse:file
// responsibility: Persists and retrieves session objects from SQL Server database
// actor: shared
// role: session_persistence
// source_truth: implementation

const { getSqlConfig, sqlStringLiteral, runSql, runSqlJson } = require("../sql-helpers");
const { ensureSchema } = require("./schema-manager");

// warehouse:method
// responsibility: Persists and retrieves session objects: writes session to database using MERGE statement
// actor: shared
// role: session_persistence
// source_truth: implementation
function saveSessionRow(session) {
  ensureSchema();
  const { schema } = getSqlConfig();
  runSql(`
SET NOCOUNT ON;
MERGE ${schema}.sessions AS target
USING (
  SELECT
    ${sqlStringLiteral(session.id)} AS session_id,
    ${sqlStringLiteral(session.brief)} AS brief,
    ${sqlStringLiteral(session.currentStage)} AS current_stage,
    ${session.completed ? 1 : 0} AS completed,
    ${sqlStringLiteral(JSON.stringify(session.intent || {}))} AS intent_json,
    ${sqlStringLiteral(JSON.stringify(session.stages || {}))} AS stages_json,
    ${sqlStringLiteral(JSON.stringify(session.operations || {}))} AS operations_json,
    CAST(${sqlStringLiteral(session.createdAt)} AS DATETIME2) AS created_at,
    CAST(${sqlStringLiteral(session.updatedAt)} AS DATETIME2) AS updated_at
) AS source
ON target.session_id = source.session_id
WHEN MATCHED THEN UPDATE SET
  brief = source.brief,
  current_stage = source.current_stage,
  completed = source.completed,
  intent_json = source.intent_json,
  stages_json = source.stages_json,
  operations_json = source.operations_json,
  created_at = source.created_at,
  updated_at = source.updated_at
WHEN NOT MATCHED THEN INSERT (
  session_id, brief, current_stage, completed, intent_json, stages_json, operations_json, created_at, updated_at
) VALUES (
  source.session_id, source.brief, source.current_stage, source.completed, source.intent_json, source.stages_json, source.operations_json, source.created_at, source.updated_at
);
`);
}

// warehouse:method
// responsibility: Persists and retrieves session objects: retrieves session from database and converts to JSON
// actor: shared
// role: session_persistence
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
// responsibility: Persists and retrieves session objects: lists all sessions from database ordered by creation date
// actor: shared
// role: session_persistence
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

module.exports = { saveSessionRow, getSessionRow, listSessionRows };
