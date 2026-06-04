// warehouse:file
// responsibility: Status command handler: retrieves current session, summarizes pending/running/completed operations, renders state in JSON or text format
// actor: cli
// role: command_handler
// source_truth: implementation

const { getSession, getCurrentSessionId } = require("../../core/session-store");
const { summarizeOperations } = require("../../shared/actions");
const { exit } = require("../print");

// warehouse:method
// responsibility: Status command: retrieves current session, renders state with operation summaries in JSON format
// actor: cli
// role: status_command
// source_truth: implementation
async function status(sessionId = null, options = {}) {
  try {
    const id = sessionId || getCurrentSessionId();
    if (!id) {
      exit(0, JSON.stringify({ ok: false, message: "No active session" }, null, 2));
      return;
    }

    const session = getSession(id);
    if (!session) {
      exit(0, JSON.stringify({ ok: false, message: `Session not found: ${id}` }, null, 2));
      return;
    }

    const stageState = session.stages[session.currentStage];
    const operations = summarizeOperations(session);
    console.log(
      JSON.stringify(
        {
          ok: true,
          sessionId: session.id,
          brief: session.brief,
          currentStage: session.currentStage,
          stageAccepted: stageState.accepted || false,
          roundsInStage: (stageState.rounds || []).length,
          hasProposedArtifact: !!stageState.proposedArtifact,
          operations,
          completed: session.completed,
          createdAt: session.createdAt
        },
        null,
        2
      )
    );
  } catch (error) {
    exit(2, `Error: ${error.message}`);
  }
}

module.exports = { status };
