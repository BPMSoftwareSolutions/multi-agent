// warehouse:file
// responsibility: Reads file and truncates content to character budget for prompt embedding with ellipsis marker
// actor: worker_bee_infrastructure
// role: file_reader
// source_truth: implementation

const fs = require("fs");
const { stripBom } = require("../text-utils");

// warehouse:method
// responsibility: Reads file and truncates content to character budget for prompt embedding with ellipsis marker
// actor: method_implementation
// role: implementation
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
