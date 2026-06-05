// warehouse:file
// responsibility: Extracts warehouse:file header from supported source files into taxonomy structure and key-value object
// actor: method_implementation
// role: implementation
// source_truth: implementation

// warehouse:method
// responsibility: Extracts warehouse:file header from supported source files into taxonomy structure and key-value object
// actor: method_implementation
// role: implementation
// source_truth: implementation
function extractFileHeader(content) {
  const lines = content.split("\n");
  const header = {};
  let inFileBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#!")) continue;
    if (!trimmed) {
      // A blank line ends the file-anchor block. Without this, the scan would
      // bleed into the following # warehouse:method block and overwrite the
      // file's responsibility with the method's.
      if (inFileBlock) break;
      continue;
    }
    if (!trimmed.startsWith("//") && !trimmed.startsWith("#")) break;

    const match = trimmed.match(/^(?:\/\/|#)\s*(\w+):(.*)$/);
    if (!match) continue;
    const key = match[1];
    const value = match[2].trim();

    if (key === "warehouse") {
      if (value === "file") { inFileBlock = true; header.warehouse = "file"; continue; }
      // Any other warehouse:* marker (method/function/boundary) ends the file block.
      if (inFileBlock) break;
      continue;
    }
    if (inFileBlock) header[key] = value;
  }

  return header.warehouse === "file" ? header : {};
}

module.exports = { extractFileHeader };
