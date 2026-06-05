// warehouse:file
// responsibility: Renders session state to JSON format for machine-readable output
// actor: cli
// role: renderer
// source_truth: implementation

const { summarizeOperations } = require("../../shared/actions");

// warehouse:method
// responsibility: Renders session state to JSON format for machine-readable output
// actor: method_implementation
// role: implementation
// source_truth: implementation
function renderSessionJson(session) {
  const operationsSummary = summarizeOperations(session);

  return JSON.stringify(
    {
      sessionId: session.id,
      brief: session.brief,
      currentStage: session.currentStage,
      completed: session.completed,
      intent: session.intent,
      stages: Object.entries(session.stages || {}).reduce((acc, [stageId, state]) => {
        acc[stageId] = {
          accepted: state.accepted || false,
          roundCount: (state.rounds || []).length,
          artifact: state.artifact
        };
        return acc;
      }, {}),
      operations: {
        summary: operationsSummary,
        approvedActions: session.operations.approvedActions,
        humanReviewQueue: session.operations.humanReviewQueue,
        actionAttempts: session.operations.actionAttempts
      }
    },
    null,
    2
  );
}

module.exports = { renderSessionJson };
