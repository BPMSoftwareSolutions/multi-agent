// warehouse:file
// responsibility: Round command handler: loads session, executes planning and review cycle via orchestrator, renders round results, saves updated session with new artifacts
// actor: cli
// role: command_handler
// source_truth: implementation

const { getSession, getCurrentSessionId, saveSession } = require("../../core/session-store");
const { runRound } = require("../../core/run-round");
const { renderRound, exit } = require("../print");

// warehouse:method
// responsibility: Round command: executes planning and review cycle via orchestrator, saves session with new artifacts
// actor: cli
// role: round_command
// source_truth: implementation
async function round(note = "", apiKey = null, options = {}) {
  try {
    const sessionId = options.sessionId || getCurrentSessionId();
    if (!sessionId) {
      exit(1, "Error: No active session. Use 'studio start <brief>' to begin.");
    }

    const session = getSession(sessionId);
    if (!session) {
      exit(1, `Error: Session not found: ${sessionId}`);
    }

    if (session.completed) {
      exit(1, "Error: Session is already completed. Cannot run more rounds.");
    }

    console.log(
      `\nRunning round ${session.stages[session.currentStage].rounds.length + 1}...`
    );
    const { roundNumber, round: roundData } = await runRound({
      session,
      apiKey,
      humanInterjection: note || ""
    });

    saveSession(session);

    if (options.json) {
      console.log(
        JSON.stringify(
          {
            ok: true,
            sessionId: session.id,
            stage: session.currentStage,
            roundNumber,
            planner: {
              artifact: roundData.planner.artifact,
              durationMs: roundData.planner.durationMs
            },
            reviewer: {
              intent_issues: roundData.reviewer.intent_issues || [],
              complexity_issues: roundData.reviewer.complexity_issues || [],
              validity_issues: roundData.reviewer.validity_issues || [],
              change_summary: roundData.reviewer.change_summary || [],
              suggested_artifact: roundData.reviewer.suggested_artifact,
              action_recommendations: roundData.reviewer.action_recommendations || [],
              durationMs: roundData.reviewer.durationMs
            },
            proposedArtifact: roundData.artifactAfter
          },
          null,
          2
        )
      );
    } else {
      console.log(renderRound(roundData, { stageId: session.currentStage }));
    }

    return session;
  } catch (error) {
    exit(2, `Error: ${error.message}`);
  }
}

module.exports = { round };
