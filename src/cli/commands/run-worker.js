// warehouse:file
// responsibility: Delegates run-worker command to modules: orchestrates session loading, worker execution, result printing
// actor: cli
// role: command_handler
// source_truth: implementation

const { saveSession } = require("../../core/session-store");
const { runWorker } = require("../../shared/actions");
const { executeDriveWorker } = require("../../../server/drive/service");
const { loadWorkerSession } = require("./worker-session-loader");
const { printWorkerResult } = require("./worker-result-printer");

// warehouse:method
// responsibility: undefined
// actor: undefined
// role: undefined
// source_truth: implementation

async function runWorkerCommand(actionId = null, options = {}) {
  try {
    const session = loadWorkerSession(options);

    const result = await runWorker(session, {
      actionId,
      actor: "cli_worker",
      executeExternalAction: ({ session: currentSession, action, actor }) =>
        executeDriveWorker(currentSession, { actionId: action.actionId, actor })
    });

    saveSession(session);
    return printWorkerResult(result, options);
  } catch (error) {
    const { exit } = require("../print");
    exit(2, `Error: ${error.message}`);
  }
}

module.exports = {
  runWorkerCommand
};
