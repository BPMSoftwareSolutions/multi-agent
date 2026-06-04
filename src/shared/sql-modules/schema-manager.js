// warehouse:file
// responsibility: Initializes and manages SQL Server database schema for persistence tables
// actor: persistence_layer
// role: schema_manager
// source_truth: implementation

const { getSqlConfig, runSql } = require("../sql-helpers");

let schemaReady = false;

// warehouse:method
// responsibility: Ensures SQL Server schema exists and creates persistence tables (sessions, app_state, oauth_tokens)
// actor: method_implementation
// role: implementation
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

module.exports = { ensureSchema };
