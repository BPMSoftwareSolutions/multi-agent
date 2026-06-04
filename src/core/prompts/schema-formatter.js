// warehouse:file
// responsibility: Converts a schema object into human-readable field descriptions for prompt injection
// actor: core_runtime
// role: formatter
// source_truth: implementation

// warehouse:method
// responsibility: undefined
// actor: undefined
// role: undefined
// source_truth: implementation

function schemaToText(schema) {
  const lines = ["Fields required in your JSON response:"];
  for (const [field, meta] of Object.entries(schema || {})) {
    lines.push(`- ${field} (${meta.type}): ${meta.description}`);
  }
  return lines.join("\n");
}

// warehouse:method
// responsibility: undefined
// actor: undefined
// role: undefined
// source_truth: implementation

function toJSONString(value) {
  return JSON.stringify(value, null, 2);
}

module.exports = { schemaToText, toJSONString };
