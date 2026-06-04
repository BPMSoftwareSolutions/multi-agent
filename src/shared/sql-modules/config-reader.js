// warehouse:file
// responsibility: Reads SQL Server configuration from environment
// actor: shared_infrastructure
// role: config_reader
// source_truth: implementation

function getSqlConfig() {
  const server = process.env.LOC_SQL_SERVER || "localhost";
  const database = process.env.LOC_SQL_DATABASE || "master";
  const username = process.env.LOC_SQL_USERNAME || "sa";
  const password = process.env.LOC_SQL_PASSWORD || "YourPassword123!";
  const schema = process.env.LOC_SQL_SCHEMA || "app";
  return { server, database, username, password, schema };
}

module.exports = { getSqlConfig };
