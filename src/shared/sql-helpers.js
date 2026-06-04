// warehouse:file
// responsibility: Provides SQL Server connection, escaping, and command-line utilities for database operations
// actor: shared_infrastructure
// role: sql_utilities
// source_truth: implementation

const path = require("path");
const { execSync } = require("child_process");

// warehouse:method
// responsibility: Reads SQL Server configuration from environment variables, constructing connection string with defaults
// actor: shared_infrastructure
// role: configuration_reader
// source_truth: implementation
function getSqlConfig() {
  const server = process.env.LOC_SQL_SERVER || "localhost";
  const database = process.env.LOC_SQL_DATABASE || "master";
  const username = process.env.LOC_SQL_USERNAME || "sa";
  const password = process.env.LOC_SQL_PASSWORD || "YourPassword123!";

  return { server, database, username, password };
}

// warehouse:method
// responsibility: Escapes and wraps value as SQL string literal, handling Unicode and special characters safely
// actor: shared_infrastructure
// role: sql_escaper
// source_truth: implementation
function sqlStringLiteral(value) {
  if (value === null || value === undefined) return "NULL";
  const escaped = String(value).replace(/'/g, "''");
  return `N'${escaped}'`;
}

// warehouse:method
// responsibility: Builds sqlcmd command-line arguments array with server, database, credentials, and input file parameters
// actor: shared_infrastructure
// role: command_builder
// source_truth: implementation
function buildSqlcmdArgs(databaseOverride, inputFile) {
  const config = getSqlConfig();
  const database = databaseOverride || config.database;

  return [
    "-S",
    config.server,
    "-d",
    database,
    "-U",
    config.username,
    "-P",
    config.password,
    "-i",
    inputFile,
    "-o",
    path.join(path.dirname(inputFile), "out.txt"),
  ];
}

// warehouse:method
// responsibility: Writes SQL query to temp file, executes via sqlcmd, and returns raw output or exits on error
// actor: shared_infrastructure
// role: query_executor
// source_truth: implementation
function runSql(query, databaseOverride) {
  const fs = require("fs");
  const tmp = require("tmp");

  const tmpFile = tmp.fileSync({ suffix: ".sql" });
  fs.writeFileSync(tmpFile.name, query, "utf8");

  try {
    const args = buildSqlcmdArgs(databaseOverride, tmpFile.name);
    const cmd = `sqlcmd ${args.map((a) => `"${a}"`).join(" ")}`;
    const output = execSync(cmd, { encoding: "utf8" });
    return output;
  } finally {
    tmpFile.removeCallback();
  }
}

// warehouse:method
// responsibility: Executes SQL query and parses JSON output, finding first valid JSON object in result stream
// actor: shared_infrastructure
// role: query_executor
// source_truth: implementation
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

module.exports = {
  getSqlConfig,
  sqlStringLiteral,
  buildSqlcmdArgs,
  runSql,
  runSqlJson,
};
