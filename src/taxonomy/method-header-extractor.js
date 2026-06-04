// warehouse:file
// responsibility: Extracts warehouse method taxonomy for every supported function and marks undocumented functions as missing taxonomy
// actor: method_implementation
// role: implementation
// source_truth: implementation

// warehouse:method
// responsibility: Extracts warehouse method taxonomy for every supported function and marks undocumented functions as missing taxonomy
// actor: method_implementation
// role: implementation
// source_truth: implementation
function extractMethodHeaders(content, filePath = "") {
  const lines = content.split("\n");
  const methods = [];
  let currentMethod = null;
  const isPython = filePath.endsWith(".py");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check if this is a method header start
    if (trimmed.match(/^(?:\/\/|#)\s*warehouse:\s*method/)) {
      currentMethod = { name: null, taxonomy: { warehouse: "method" } };
      continue;
    }

    if (currentMethod && (trimmed.startsWith("//") || trimmed.startsWith("#"))) {
      const match = trimmed.match(/^(?:\/\/|#)\s*(\w+):\s*(.*)$/);
      if (match && match[1] !== "warehouse") {
        currentMethod.taxonomy[match[1]] = match[2].trim();
      }
    }

    let nameMatch = null;
    if (isPython) {
      nameMatch = trimmed.match(/^(?:async\s+)?def\s+(\w+)\s*\(/);
    } else {
      nameMatch = trimmed.match(/^(?:async\s+)?function\s+(\w+)\s*\(/);
      if (!nameMatch) {
        nameMatch = trimmed.match(/^const\s+(\w+)\s*=\s*(?:async\s*)?(?:function\b|\([^)]*\)\s*=>|\w+\s*=>)/);
      }
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
