// warehouse:file
// responsibility: Executes SQL queries via sqlcmd and parses results
// actor: shared_infrastructure
// role: query_executor
// source_truth: implementation

const { execSync } = require("child_process");
const fs = require("fs");
const tmp = require("tmp");
const { buildSqlcmdArgs } = require("./command-builder");

function runSql(query, databaseOverride) {
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

module.exports = { runSql, runSqlJson };
