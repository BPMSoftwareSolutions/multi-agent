// warehouse:file
// responsibility: Processes action approval payload and queues to session operations with context metadata
// actor: cli
// role: command_handler
// source_truth: implementation

const { approveManualAction } = require("../../shared/actions");

// warehouse:method
// responsibility: Parses and validates JSON payload from string or file input
// actor: method_implementation
// role: implementation
// source_truth: implementation
function parsePayload(rawPayload) {
  try {
    return JSON.parse(rawPayload);
  } catch (error) {
    throw new Error(`Invalid JSON payload: ${error.message}`);
  }
}

// warehouse:method
// responsibility: Queues approved action to session with context metadata
// actor: method_implementation
// role: implementation
// source_truth: implementation
function queueApprovedAction(session, payload) {
  const summary = approveManualAction(session, payload, {
    stageId: session.currentStage,
    roundNumber: session.stages[session.currentStage].rounds.length,
    approvedBy: "manual_cli"
  });
  return summary;
}

module.exports = { parsePayload, queueApprovedAction };
