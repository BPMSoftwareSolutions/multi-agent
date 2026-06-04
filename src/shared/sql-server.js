// warehouse:file
// responsibility: Persists and retrieves session state, app state, and OAuth tokens from SQL Server database
// actor: shared
// role: persistence_provider
// source_truth: implementation

const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  getSqlConfig,
  sqlStringLiteral,
  buildSqlcmdArgs,
  runSql,
  runSqlJson,
} = require("./sql-helpers");

let schemaReady = false;

// Note: getSqlConfig, sqlStringLiteral, buildSqlcmdArgs, runSql, and runSqlJson
// are imported from sql-helpers.js

// warehouse:method
// responsibility: Ensures schema exists and creates required tables (sessions, app_state, oauth_tokens) if missing
// actor: shared
// role: schema_initializer
// source_truth: implementation
function ensureSchema() {
  if (schemaReady) {
    return;
  }

  const { schema } = getSqlConfig();
  runSql(`
SET NOCOUNT ON;
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = '${schema}')
BEGIN
  EXEC('CREATE SCHEMA ${schema}');
END;

IF OBJECT_ID('${schema}.sessions', 'U') IS NULL
BEGIN
  CREATE TABLE ${schema}.sessions (
    session_id NVARCHAR(64) NOT NULL PRIMARY KEY,
    brief NVARCHAR(MAX) NOT NULL,
    current_stage NVARCHAR(50) NOT NULL,
    completed BIT NOT NULL,
    intent_json NVARCHAR(MAX) NOT NULL,
    stages_json NVARCHAR(MAX) NOT NULL,
    operations_json NVARCHAR(MAX) NOT NULL,
    created_at DATETIME2 NOT NULL,
    updated_at DATETIME2 NOT NULL
  );
END;

IF OBJECT_ID('${schema}.app_state', 'U') IS NULL
BEGIN
  CREATE TABLE ${schema}.app_state (
    state_key NVARCHAR(100) NOT NULL PRIMARY KEY,
    state_value NVARCHAR(MAX) NULL,
    updated_at DATETIME2 NOT NULL
  );
END;

IF OBJECT_ID('${schema}.oauth_tokens', 'U') IS NULL
BEGIN
  CREATE TABLE ${schema}.oauth_tokens (
    provider NVARCHAR(100) NOT NULL PRIMARY KEY,
    token_json NVARCHAR(MAX) NOT NULL,
    updated_at DATETIME2 NOT NULL
  );
END;
`);

  schemaReady = true;
}

// warehouse:method
// responsibility: Persists session to database using MERGE statement, handles insert or update based on session id
// actor: shared
// role: session_persister
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
// responsibility: Retrieves single session from database by id, converts columns to JSON, returns JSON object or null
// actor: shared
// role: session_retriever
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
// responsibility: Retrieves all sessions from database ordered by creation date, returns JSON array with id and timestamp
// actor: shared
// role: session_lister
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

// warehouse:method
// responsibility: Persists app state value to database using MERGE, creates or updates by key
// actor: shared
// role: app_state_persister
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
// responsibility: Retrieves app state value from database by key, returns value or null if not found
// actor: shared
// role: app_state_retriever
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

// warehouse:method
// responsibility: Persists OAuth token JSON to database by provider using MERGE, creates or updates token
// actor: shared
// role: oauth_token_persister
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
// responsibility: Retrieves OAuth token JSON from database by provider, returns token string or null if not found
// actor: shared
// role: oauth_token_retriever
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

module.exports = {
  ensureSchema,
  getAppState,
  getOAuthToken,
  getSessionRow,
  getSqlConfig,
  listSessionRows,
  runSql,
  saveSessionRow,
  setAppState,
  setOAuthToken
};