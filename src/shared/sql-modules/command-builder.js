// warehouse:file
// responsibility: Builds sqlcmd command-line arguments
// actor: shared_infrastructure
// role: command_builder
// source_truth: implementation

const path = require("path");
const { getSqlConfig } = require("./config-reader");

function buildSqlcmdArgs(databaseOverride, inputFile) {
  const config = getSqlConfig();
  const database = databaseOverride || config.database;
  return ["-S", config.server, "-d", database, "-U", config.username, "-P", config.password, "-i", inputFile, "-o", path.join(path.dirname(inputFile), "out.txt")];
}

module.exports = { buildSqlcmdArgs };
