// warehouse:file
// responsibility: Reads and processes file content by truncating to character budget for prompt embedding with ellipsis marker
// actor: worker_bee_infrastructure
// role: content_reader
// source_truth: implementation

const fs = require("fs");
const { stripBom } = require("../text-utils");

// warehouse:method
// responsibility: Reads file content and truncates to character budget with ellipsis marker for prompt embedding
// actor: worker_bee_infrastructure
// role: content_reader
// source_truth: implementation
function readForPrompt(absPath, fileCharBudget) {
  let text;
  try {
    text = stripBom(fs.readFileSync(absPath, "utf8"));
  } catch (_e) {
    return "";
  }
  return text.length <= fileCharBudget ? text : text.slice(0, fileCharBudget) + "\n# ...[truncated]...";
}

module.exports = { readForPrompt };
