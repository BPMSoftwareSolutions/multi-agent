// warehouse:file
// responsibility: Extracts warehouse:file header from JavaScript file into taxonomy structure
// actor: taxonomy_analyzer
// role: file_header_extractor
// source_truth: implementation

// warehouse:method
// responsibility: Extracts warehouse:file header from JavaScript file into taxonomy structure and key-value object
// actor: method_implementation
// role: implementation
// source_truth: implementation
function extractFileHeader(content) {
  const lines = content.split("\n");
  const header = {};
  let foundFileHeader = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#!") || !trimmed) continue;
    if (!trimmed.startsWith("//")) break;

    // Parse warehouse:X field
    const match = trimmed.match(/^\/\/\s*(\w+):(.*)$/);
    if (match) {
      const key = match[1];
      const value = match[2].trim();
      header[key] = value;

      if (key === "warehouse" && value === "file") {
        foundFileHeader = true;
      }
    }
  }

  return foundFileHeader ? header : {};
}

module.exports = { extractFileHeader };
