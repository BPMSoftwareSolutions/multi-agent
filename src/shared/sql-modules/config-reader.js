// warehouse:file
// responsibility: Coordinates getSqlConfig behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation

// warehouse:method
// responsibility: Coordinates getSqlConfig behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
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
