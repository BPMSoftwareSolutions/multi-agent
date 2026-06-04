// warehouse:file
// responsibility: Escapes and wraps SQL string literals
// actor: shared_infrastructure
// role: sql_escaper
// source_truth: implementation

function sqlStringLiteral(value) {
  if (value === null || value === undefined) return "NULL";
  const escaped = String(value).replace(/'/g, "''");
  return `N'${escaped}'`;
}

module.exports = { sqlStringLiteral };
