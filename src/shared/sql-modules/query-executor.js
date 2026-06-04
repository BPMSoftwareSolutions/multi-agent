// warehouse:file
// responsibility: Delegator: re-exports SQL runner and JSON parser for backward compatibility
// actor: shared_infrastructure
// role: query_executor
// source_truth: implementation

const { runSql } = require("./sql-runner");
const { runSqlJson } = require("./json-parser");

module.exports = { runSql, runSqlJson };
