// warehouse:file
// responsibility: Renders session state to human-readable text format for CLI display
// actor: cli
// role: renderer
// source_truth: implementation

const { STAGES } = require("../../core/stages");
const { summarizeOperations } = require("../../shared/actions");
const { renderArtifact } = require("./artifact-renderer");

// warehouse:method
// responsibility: Renders session state to human-readable text format for CLI display
// actor: method_implementation
// role: implementation
// source_truth: implementation
function renderSessionText(session) {
  const operationsSummary = summarizeOperations(session);

  const lines = [
    "=== Session ===",
    `ID: ${session.id}`,
    `Brief: ${session.brief}`,
    `Current Stage: ${session.currentStage}`,
    `Completed: ${session.completed ? "Yes" : "No"}`,
    ""
  ];

  if (session.intent && session.intent.task_definition) {
    lines.push("--- Intent ---");
    lines.push(`Task: ${session.intent.task_definition}`);
    if (session.intent.success_criteria && session.intent.success_criteria.length) {
      lines.push("Success Criteria:");
      session.intent.success_criteria.forEach((c) => {
        lines.push(`  - ${c}`);
      });
    }
    lines.push("");
  }

  Object.entries(session.stages || {}).forEach(([stageId, state]) => {
    const stage = STAGES[stageId];
    lines.push(`--- Stage: ${stage.label} ---`);
    lines.push(`Accepted: ${state.accepted ? "Yes" : "No"}`);
    lines.push(`Rounds: ${(state.rounds || []).length}`);

    if (state.artifact && Object.keys(state.artifact).length) {
      lines.push("Current Artifact:");
      renderArtifact(stageId, state.artifact)
        .split("\n")
        .forEach((line) => {
          if (line) lines.push(`  ${line}`);
        });
    }

    if (state.proposedArtifact && Object.keys(state.proposedArtifact).length) {
      lines.push("Proposed Artifact:");
      renderArtifact(stageId, state.proposedArtifact)
        .split("\n")
        .forEach((line) => {
          if (line) lines.push(`  ${line}`);
        });
    }

    lines.push("");
  });

  lines.push("--- Operations ---");
  lines.push(`Approved Actions: ${operationsSummary.approvedActions}`);
  lines.push(`Pending Actions: ${operationsSummary.pendingActions}`);
  lines.push(`Completed Actions: ${operationsSummary.doneActions}`);
  lines.push(`Failed Actions: ${operationsSummary.failedActions}`);
  lines.push(`Blocked Actions: ${operationsSummary.blockedActions}`);
  lines.push(`Human Review Queue: ${operationsSummary.humanReviewItems}`);

  if (session.operations.approvedActions.length) {
    lines.push("Approved Action Queue:");
    session.operations.approvedActions.forEach((action) => {
      lines.push(
        `  - ${action.actionId} | ${action.actionType} | ${action.fileId} | ${action.status}`
      );
    });
  }

  if (session.operations.humanReviewQueue.length) {
    lines.push("Human Review Items:");
    session.operations.humanReviewQueue.forEach((item) => {
      lines.push(`  - ${item.itemId} | ${item.riskLevel} | ${item.reason}`);
    });
  }

  return lines.join("\n");
}

module.exports = { renderSessionText };
