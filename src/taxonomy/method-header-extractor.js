// warehouse:file
// responsibility: Extracts warehouse method taxonomy for every JavaScript function and marks undocumented functions as missing taxonomy
// actor: taxonomy_analyzer
// role: method_header_extractor
// source_truth: implementation

// warehouse:method
// responsibility: Extracts warehouse method taxonomy for every JavaScript function and marks undocumented functions as missing taxonomy
// actor: method_implementation
// role: implementation
// source_truth: implementation
function extractMethodHeaders(content) {
  const lines = content.split("\n");
  const methods = [];
  let currentMethod = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check if this is a method header start
    if (trimmed.match(/^\/\/\s*warehouse:\s*method/)) {
      currentMethod = { name: null, taxonomy: { warehouse: "method" } };
      continue;
    }

    // Collect taxonomy lines for current method
    if (currentMethod && trimmed.startsWith("//")) {
      const match = trimmed.match(/^\/\/\s*(\w+):\s*(.*)$/);
      if (match && match[1] !== "warehouse") {
        currentMethod.taxonomy[match[1]] = match[2].trim();
      }
    }

    let nameMatch = trimmed.match(/^(?:async\s+)?function\s+(\w+)\s*\(/);
    if (!nameMatch) {
      nameMatch = trimmed.match(/^const\s+(\w+)\s*=\s*(?:async\s*)?(?:function\b|\([^)]*\)\s*=>|\w+\s*=>)/);
    }

    if (nameMatch) {
      const method = currentMethod || { name: null, taxonomy: { warehouse: "method", responsibility: "" } };
      method.name = nameMatch[1];
      methods.push(method);
      currentMethod = null;
    }
  }

  return methods;
}

module.exports = { extractMethodHeaders };
