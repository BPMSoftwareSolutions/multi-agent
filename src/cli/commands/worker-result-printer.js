// warehouse:file
// responsibility: Formats and outputs worker execution results to CLI with JSON or human-readable formatting
// actor: cli
// role: worker_result_printer
// source_truth: implementation

const { exit } = require("../print");

// warehouse:method
// responsibility: undefined
// actor: undefined
// role: undefined
// source_truth: implementation

function printWorkerResult(result, options = {}) {
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return result;
  }

  if (!result.ok) {
    exit(1, `Error: ${result.message}`);
  }

  console.log(result.message);
  if (result.action) {
    console.log(`Action: ${result.action.actionId} (${result.action.actionType})`);
    console.log(`File: ${result.action.fileId}`);
    console.log(`Status: ${result.action.status}`);
  }

  return result;
}

module.exports = { printWorkerResult };
