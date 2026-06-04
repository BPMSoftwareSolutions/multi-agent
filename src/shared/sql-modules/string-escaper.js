// warehouse:file
// responsibility: Escapes and wraps string value as SQL string literal with null handling
// actor: method_implementation
// role: implementation
// source_truth: implementation

// warehouse:method
// responsibility: Escapes and wraps string value as SQL string literal with null handling
// actor: method_implementation
// role: implementation
// source_truth: implementation
function sqlStringLiteral(value) {
  if (value === null || value === undefined) return "NULL";
  const escaped = String(value).replace(/'/g, "''");
  return `N'${escaped}'`;
}

module.exports = { sqlStringLiteral };
