// warehouse:file
// responsibility: Advances session to next stage and saves state
// actor: cli
// role: command_executor
// source_truth: implementation

const { saveSession } = require("../../core/session-store");
const { advanceStage } = require("../../core/run-round");

// warehouse:method
// responsibility: Advances session to next stage and saves state — function
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function advanceToNextStage(session) {
  const nextStageId = await advanceStage(session);
  saveSession(session);
  return nextStageId;
}

module.exports = { advanceToNextStage };
