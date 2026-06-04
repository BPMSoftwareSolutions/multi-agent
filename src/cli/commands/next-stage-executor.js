// warehouse:file
// responsibility: Calls advanceStage logic and saves updated session to store
// actor: cli
// role: executor
// source_truth: implementation

const { saveSession } = require("../../core/session-store");
const { advanceStage } = require("../../core/run-round");

// warehouse:method
// responsibility: Calls advanceStage logic and saves updated session to store
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function executeNextStage(session) {
  const nextStageId = await advanceStage(session);
  saveSession(session);
  return nextStageId;
}

module.exports = { executeNextStage };
