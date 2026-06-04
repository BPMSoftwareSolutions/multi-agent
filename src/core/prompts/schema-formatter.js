// warehouse:file
// responsibility: Converts a schema object into human-readable field descriptions for prompt injection
// actor: method_implementation
// role: implementation
// source_truth: implementation

// warehouse:method
// responsibility: Converts a schema object into human-readable field descriptions for prompt injection
// actor: method_implementation
// role: implementation
// source_truth: implementation
function schemaToText(schema) {
  const lines = ["Fields required in your JSON response:"];
  for (const [field, meta] of Object.entries(schema || {})) {
    lines.push(`- ${field} (${meta.type}): ${meta.description}`);
  }
  return lines.join("\n");
}

// warehouse:method
// responsibility: Serializes values to formatted JSON strings for prompt embedding
// actor: method_implementation
// role: implementation
// source_truth: implementation
function toJSONString(value) {
  return JSON.stringify(value, null, 2);
}

module.exports = { schemaToText, toJSONString };
