// warehouse:file
// responsibility: Orchestrates approve-action command: parses payload, queues action, saves session
// actor: cli
// role: command_handler
// source_truth: implementation

const fs = require("fs");

const { getSession, getCurrentSessionId, saveSession } = require("../../core/session-store");
const { parsePayload, queueApprovedAction } = require("./approval-processor");
const { exit } = require("../print");

// warehouse:method
// responsibility: Orchestrates action approval workflow: validates session, parses payload, queues and saves
// actor: cli
// role: command_handler
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

    const rawPayload = options.payloadFile
      ? fs.readFileSync(options.payloadFile, "utf8")
      : options.payload;
    const payload = parsePayload(rawPayload);

    const session = getSession(sessionId);
    if (!session) {
      exit(1, `Error: Session not found: ${sessionId}`);
    }

    const summary = queueApprovedAction(session, payload);
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