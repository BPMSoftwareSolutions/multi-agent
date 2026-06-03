// warehouse:file
// responsibility: Provides SQL Server integration for persisting and retrieving sessions, app state, and OAuth tokens
// actor: shared
// role: persistence_provider
// source_truth: implementation

const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

let schemaReady = false;

function getSqlConfig() {
  return {
    server: process.env.SQL_SERVER_INSTANCE || process.env.SQL_SERVER || "BPMHOMEOFFICE",
    database: process.env.SQL_DATABASE || "ai-engine",
    schema: process.env.SQL_SCHEMA || "studio",
    username: process.env.SQL_USER || "",
    password: process.env.SQL_PASSWORD || ""
  };
}

function sqlStringLiteral(value) {
  if (value === null || value === undefined) {
    return "NULL";
  }

  const normalized = String(value).replace(/'/g, "''");
  return `N'${normalized}'`;
}

function buildSqlcmdArgs(databaseOverride, inputFile) {
  const config = getSqlConfig();
  const args = ["-S", config.server, "-d", databaseOverride || config.database];

  if (config.username && config.password) {
    args.push("-U", config.username, "-P", config.password);
  } else {
    args.push("-E");
  }

  args.push("-i", inputFile, "-w", "65535", "-y", "0", "-Y", "0");
  return args;
}

function runSql(query, databaseOverride) {
  const tempFile = path.join(
    os.tmpdir(),
    `multi-agent-studio-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.sql`
  );

  fs.writeFileSync(tempFile, query, "utf8");
  try {
    const output = execFileSync("sqlcmd", buildSqlcmdArgs(databaseOverride, tempFile), {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    });

    return String(output || "").trim();
  } finally {
    try {
      fs.unlinkSync(tempFile);
    } catch {
      // Ignore cleanup failures for temp SQL files.
    }
  }
}

function runSqlJson(query, databaseOverride) {
  const output = runSql(query, databaseOverride).trim();
  if (!output) {
    return null;
  }

  const objectIndex = output.indexOf("{");
  const arrayIndex = output.indexOf("[");
  let jsonStart = -1;

  if (arrayIndex !== -1 && objectIndex !== -1) {
    jsonStart = Math.min(arrayIndex, objectIndex);
  } else {
    jsonStart = arrayIndex !== -1 ? arrayIndex : objectIndex;
  }

  if (jsonStart > 0) {
    return JSON.parse(output.slice(jsonStart));
  }
  return JSON.parse(output);
}

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