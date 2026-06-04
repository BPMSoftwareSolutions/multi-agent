// warehouse:file
// responsibility: Formats round output as JSON or human-readable text with stage context
// actor: cli
// role: renderer
// source_truth: implementation

const { renderRound } = require("../print");

// warehouse:method
// responsibility: Formats round output as JSON or human-readable text with stage context
// actor: method_implementation
// role: implementation
// source_truth: implementation
function renderRoundOutput(session, roundNumber, roundData, options = {}) {
  if (options.json) {
    return JSON.stringify(
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
    );
  }

  return renderRound(roundData, { stageId: session.currentStage });
}

module.exports = { renderRoundOutput };
