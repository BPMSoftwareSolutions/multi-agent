// warehouse:file
// responsibility: Parses JSON output from SQL query results
// actor: query_executor
// role: output_parser
// source_truth: implementation

const { runSql } = require("./sql-runner");

function runSqlJson(query, databaseOverride) {
  const output = runSql(query, databaseOverride);
  const lines = output.split("\n");
  for (const line of lines) {
    if (line.trim().startsWith("{")) {
      try {
        return JSON.parse(line.trim());
      } catch (_e) {
        // Not valid JSON, continue
      }
    }
  }
  return null;
}

module.exports = { runSqlJson };
