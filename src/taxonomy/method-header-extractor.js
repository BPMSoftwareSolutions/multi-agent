// warehouse:file
// responsibility: Extracts warehouse:method headers from JavaScript file into taxonomy array
// actor: taxonomy_analyzer
// role: method_header_extractor
// source_truth: implementation

// warehouse:method
// responsibility: Extracts all warehouse:method headers from JavaScript file into taxonomy array of documented methods
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

    // Check for function definition after method header
    if (
      currentMethod &&
      (trimmed.startsWith("function ") ||
        trimmed.startsWith("const ") ||
        trimmed.startsWith("async "))
    ) {
      // Extract function name from various patterns
      let nameMatch = trimmed.match(/function\s+(\w+)/);
      if (!nameMatch) nameMatch = trimmed.match(/const\s+(\w+)/);
      if (!nameMatch) nameMatch = trimmed.match(/async\s+(\w+)/);

      if (nameMatch) {
        currentMethod.name = nameMatch[1];
        methods.push(currentMethod);
        currentMethod = null;
      }
    }
  }

  return methods;
}

module.exports = { extractMethodHeaders };
