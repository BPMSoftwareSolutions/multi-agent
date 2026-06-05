// warehouse:file
// responsibility: Runs worker action on session and saves updated state
// actor: cli
// role: executor
// source_truth: implementation

const { saveSession } = require("../../core/session-store");
const { runWorker } = require("../../shared/actions");
const { executeDriveWorker } = require("../../../server/drive/service");

// warehouse:method
// responsibility: Runs worker action on session and saves updated state
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function executeWorker(session, actionId) {
  const result = await runWorker(session, {
    actionId,
    actor: "cli_worker",
    executeExternalAction: ({ session: currentSession, action, actor }) =>
      executeDriveWorker(currentSession, { actionId: action.actionId, actor })
  });
  saveSession(session);
  return result;
}

module.exports = { executeWorker };
