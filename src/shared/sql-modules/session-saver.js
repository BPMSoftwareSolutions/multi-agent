// warehouse:file
// responsibility: Persists session objects to SQL Server database using MERGE statement
// actor: shared
// role: session_writer
// source_truth: implementation

const { getSqlConfig, sqlStringLiteral, runSql } = require("../sql-helpers");
const { ensureSchema } = require("./schema-manager");

// warehouse:method
// responsibility: Writes session to database using MERGE statement for create/update
// actor: shared
// role: session_writer
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

module.exports = { saveSessionRow };
