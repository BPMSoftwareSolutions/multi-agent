// warehouse:file
// responsibility: SQL utilities aggregator - delegates to focused SQL modules
// actor: shared_infrastructure
// role: entry_point
// source_truth: implementation

const { getSqlConfig } = require("./sql-modules/config-reader");
const { sqlStringLiteral } = require("./sql-modules/string-escaper");
const { buildSqlcmdArgs } = require("./sql-modules/command-builder");
const { runSql, runSqlJson } = require("./sql-modules/query-executor");

module.exports = { getSqlConfig, sqlStringLiteral, buildSqlcmdArgs, runSql, runSqlJson };
