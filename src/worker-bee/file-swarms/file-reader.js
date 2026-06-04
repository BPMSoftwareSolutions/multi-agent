// warehouse:file
// responsibility: Reads files and truncates content to character budget for prompt embedding
// actor: worker_bee_infrastructure
// role: reader
// source_truth: implementation

const fs = require("fs");

const CHARS_PER_FILE = 6000;

// warehouse:method
// responsibility: Reads file and truncates to CHARS_PER_FILE budget with ellipsis marker
// actor: worker_bee_infrastructure
// role: reader
// source_truth: implementation
function readTruncated(absPath) {
  let text;
  try {
    text = fs.readFileSync(absPath, "utf8");
  } catch (_e) {
    return "";
  }
  if (text.length <= CHARS_PER_FILE) return text;
  return text.slice(0, CHARS_PER_FILE) + "\n# ...[truncated for classification]...";
}

module.exports = { readTruncated, CHARS_PER_FILE };
