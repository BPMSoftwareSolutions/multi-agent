// warehouse:file
// responsibility: Lists all sessions from SQL database ordered by creation date
// actor: persistence_layer
// role: session_lister
// source_truth: implementation

const { getSqlConfig, runSqlJson } = require("../sql-helpers");
const { ensureSchema } = require("./schema-manager");

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

module.exports = { listSessionRows };
