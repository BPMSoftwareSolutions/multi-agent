// warehouse:file
// responsibility: Accept command handler: loads session, validates proposed artifact, accepts it as current state, queues action recommendations, saves updated session
// actor: cli
// role: command_handler
// source_truth: implementation

const { getSession, getCurrentSessionId, saveSession } = require("../../core/session-store");
const { acceptArtifact } = require("../../core/run-round");
const { exit } = require("../print");

// warehouse:method
// responsibility: Validates and accepts proposed artifact
// actor: cli
// role: accept_command
// source_truth: implementation
async function accept(sessionId = null, options = {}) {
  try {
    const id = sessionId || getCurrentSessionId();
    if (!id) {
      exit(1, "Error: No active session. Use 'studio start <brief>' to begin.");
    }

    const session = getSession(id);
    if (!session) {
      exit(1, `Error: Session not found: ${id}`);
    }

    const stageState = session.stages[session.currentStage];
    if (!stageState || !stageState.proposedArtifact) {
      exit(1, "Error: No proposed artifact to accept. Run a round first.");
    }

    const { artifact, queueSummary } = await acceptArtifact(session);
    saveSession(session);

    if (options.json) {
      console.log(
        JSON.stringify(
          {
            ok: true,
            sessionId: session.id,
            stage: session.currentStage,
            artifact,
            queueSummary
          },
          null,
          2
        )
      );
    } else {
      const actionMessage =
        queueSummary && queueSummary.enqueued
          ? `\nQueued approved actions: ${queueSummary.enqueued}`
          : "";
      const humanReviewMessage =
        queueSummary && queueSummary.humanReview
          ? `\nNeeds human review: ${queueSummary.humanReview}`
          : "";
      console.log(
        `Artifact accepted for stage: ${session.currentStage}${actionMessage}${humanReviewMessage}\n\nYou can now run 'studio next-stage' to advance.`
      );
    }

    return session;
  } catch (error) {
    exit(2, `Error: ${error.message}`);
  }
}

module.exports = { accept };
