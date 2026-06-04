// warehouse:file
// responsibility: Next-stage command handler: coordinates validation, stage advancement, and session state management
// actor: cli
// role: command_handler
// source_truth: implementation

const { getSession, getCurrentSessionId, saveSession } = require("../../core/session-store");
const { advanceStage } = require("../../core/run-round");
const { exit } = require("../print");

// warehouse:method
// responsibility: Orchestrates next-stage command: validates, advances to next stage, and returns session
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function nextStage(sessionId = null, options = {}) {
  try {
    const id = sessionId || getCurrentSessionId();
    if (!id) {
      exit(1, "Error: No active session. Use 'studio start <brief>' to begin.");
    }

    const session = getSession(id);
    if (!session) {
      exit(1, `Error: Session not found: ${id}`);
    }

    const nextStageId = await advanceStage(session);
    saveSession(session);

    if (options.json) {
      console.log(
        JSON.stringify(
          {
            ok: true,
            sessionId: session.id,
            previousStage: session.stages[nextStageId] ? session.currentStage : undefined,
            currentStage: nextStageId,
            completed: session.completed
          },
          null,
          2
        )
      );
    } else {
      console.log(`Advanced to stage: ${nextStageId}`);
      if (session.completed) {
        console.log("\nSession completed! All stages finished.");
      }
    }

    return session;
  } catch (error) {
    exit(
      error.message.includes("final stage") ? 1 : error.message.includes("must be accepted") ? 1 : 2,
      `Error: ${error.message}`
    );
  }
}

module.exports = { nextStage };
