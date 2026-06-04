// warehouse:file
// responsibility: Delegates run-worker command to modules: orchestrates session loading, worker execution, result printing
// actor: cli
// role: command_handler
// source_truth: implementation

const { getSession, getCurrentSessionId, saveSession } = require("../../core/session-store");
const { runWorker } = require("../../shared/actions");
const { executeDriveWorker } = require("../../../server/drive/service");
const { exit } = require("../print");

// warehouse:method
// responsibility: Run-worker command: loads session, finds pending action, executes via worker handler, saves updated session state
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function runWorkerCommand(actionId = null, options = {}) {
  try {
    const sessionId = options.sessionId || options.session || getCurrentSessionId();
    if (!sessionId) {
      exit(1, "Error: No active session. Use 'studio start <brief>' to begin.");
    }

    const session = getSession(sessionId);
    if (!session) {
      exit(1, `Error: Session not found: ${sessionId}`);
    }

    const result = await runWorker(session, {
      actionId,
      actor: "cli_worker",
      executeExternalAction: ({ session: currentSession, action, actor }) =>
        executeDriveWorker(currentSession, { actionId: action.actionId, actor })
    });

    saveSession(session);

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
  } catch (error) {
    exit(2, `Error: ${error.message}`);
  }
}

module.exports = {
  runWorkerCommand
};