// warehouse:file
// responsibility: Orchestrates session lookup, worker execution, and output rendering
// actor: cli
// role: orchestrator
// source_truth: implementation

const { lookupSession } = require("./session-lookup");
const { executeWorker } = require("./worker-executor");
const { renderWorkerOutput } = require("./worker-renderer");
const { exit } = require("../print");

// warehouse:method
// responsibility: Orchestrates session lookup, worker execution, and output rendering
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function runWorkerCommand(actionId = null, options = {}) {
  try {
    const sessionId = options.sessionId || options.session;
    const session = lookupSession(sessionId);

    const result = await executeWorker(session, actionId);

    if (!result.ok && !options.json) {
      exit(1, `Error: ${result.message}`);
    }

    const output = renderWorkerOutput(result, options);
    console.log(output);
    return result;
  } catch (error) {
    exit(2, `Error: ${error.message}`);
  }
}

module.exports = {
  runWorkerCommand
};
