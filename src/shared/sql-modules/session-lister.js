// warehouse:file
// responsibility: Coordinates listSessionRows behavior with documented file and method taxonomy evidence
// actor: persistence_layer
// role: session_lister
// source_truth: implementation

const { getSqlConfig, runSqlJson } = require("../sql-helpers");
const { ensureSchema } = require("./schema-manager");

// warehouse:method
// responsibility: Coordinates listSessionRows behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
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

module.exports = { listSessionRows };
