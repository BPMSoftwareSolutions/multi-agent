// warehouse:file
// responsibility: Approve-action command handler: parses action payload from CLI args or file, approves manual action, queues it to session operations, saves session state
// actor: cli
// role: command_handler
// source_truth: implementation

const fs = require("fs");

const { getSession, getCurrentSessionId, saveSession } = require("../../core/session-store");
const { approveManualAction } = require("../../shared/actions");
const { exit } = require("../print");

// warehouse:method
// responsibility: Parses payload and approves manual action
// actor: cli
// role: approve_action_command
// source_truth: implementation
async function approveActionCommand(options = {}) {
  try {
    const sessionId = options.sessionId || options.session || getCurrentSessionId();
    if (!sessionId) {
      exit(1, "Error: No active session. Use 'studio start <brief>' to begin.");
    }

    if (!options.payload && !options.payloadFile) {
      exit(1, "Error: approve-action requires --payload or --payload-file.");
    }

    let payload;
    try {
      const rawPayload = options.payloadFile
        ? fs.readFileSync(options.payloadFile, "utf8")
        : options.payload;
      payload = JSON.parse(rawPayload);
    } catch (error) {
      exit(1, `Error: Invalid JSON payload: ${error.message}`);
    }

    const session = getSession(sessionId);
    if (!session) {
      exit(1, `Error: Session not found: ${sessionId}`);
    }

    const summary = approveManualAction(session, payload, {
      stageId: session.currentStage,
      roundNumber: session.stages[session.currentStage].rounds.length,
      approvedBy: "manual_cli"
    });

    saveSession(session);

    if (options.json) {
      console.log(JSON.stringify({ ok: true, summary }, null, 2));
      return summary;
    }

    console.log(`Queued approved actions: ${summary.enqueued}`);
    if (summary.humanReview) {
      console.log(`Queued for human review: ${summary.humanReview}`);
    }
    return summary;
  } catch (error) {
    exit(2, `Error: ${error.message}`);
  }
}

module.exports = {
  approveActionCommand
};