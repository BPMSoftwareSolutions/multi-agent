// warehouse:file
// responsibility: Formats worker result as JSON or human-readable text with action details
// actor: method_implementation
// role: implementation
// source_truth: implementation

// warehouse:method
// responsibility: Formats worker result as JSON or human-readable text with action details
// actor: method_implementation
// role: implementation
// source_truth: implementation
function renderWorkerOutput(result, options = {}) {
  if (options.json) {
    return JSON.stringify(result, null, 2);
  }

  let output = result.message;
  if (result.action) {
    output += `\nAction: ${result.action.actionId} (${result.action.actionType})`;
    output += `\nFile: ${result.action.fileId}`;
    output += `\nStatus: ${result.action.status}`;
  }
  return output;
}

module.exports = { renderWorkerOutput };
