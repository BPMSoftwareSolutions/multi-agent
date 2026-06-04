// warehouse:file
// responsibility: Builds sqlcmd command-line arguments array from database configuration
// actor: shared_infrastructure
// role: command_builder
// source_truth: implementation

const path = require("path");
const { getSqlConfig } = require("./config-reader");

// warehouse:method
// responsibility: Builds sqlcmd command-line arguments array from database configuration
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildSqlcmdArgs(databaseOverride, inputFile) {
  const config = getSqlConfig();
  const database = databaseOverride || config.database;
  return ["-S", config.server, "-d", database, "-U", config.username, "-P", config.password, "-i", inputFile, "-o", path.join(path.dirname(inputFile), "out.txt")];
}

module.exports = { buildSqlcmdArgs };
