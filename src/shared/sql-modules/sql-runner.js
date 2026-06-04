// warehouse:file
// responsibility: Executes SQL queries via sqlcmd and returns raw output
// actor: query_executor
// role: query_runner
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

module.exports = { runSql };
