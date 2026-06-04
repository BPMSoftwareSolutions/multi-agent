// warehouse:file
// responsibility: Formats and renders sessions, rounds, and operations state to human-readable CLI output with nested key-value pairs and exit message handling
// actor: cli
// role: output_formatter
// source_truth: implementation

const { STAGES } = require("../core/stages");
const { summarizeOperations } = require("../shared/actions");

// warehouse:method
// responsibility: Formats artifact into readable key-value pairs
// actor: cli
// role: artifact_formatter
// source_truth: implementation
function renderArtifact(stageId, artifact) {
  const stage = STAGES[stageId];
  if (!stage) return "";

  const lines = [];
  for (const [field, value] of Object.entries(artifact || {})) {
    if (Array.isArray(value)) {
      if (value.length > 0) {
        lines.push(`${field}:`);
        value.forEach((item) => {
          lines.push(`  - ${item}`);
        });
      }
    } else if (typeof value === "string" && value) {
      lines.push(`${field}: ${value}`);
    } else if (typeof value === "object" && value !== null) {
      lines.push(`${field}: ${JSON.stringify(value, null, 2)}`);
    }
  }

  return lines.join("\n");
}

// warehouse:method
// responsibility: Renders complete session state
// actor: cli
// role: session_renderer
// source_truth: implementation
function renderSession(session, options = {}) {
  const json = options.json || false;
  const operationsSummary = summarizeOperations(session);

  if (json) {
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

// warehouse:method
// responsibility: Renders round data
// actor: cli
// role: round_renderer
// source_truth: implementation
function renderRound(round, options = {}) {
  const json = options.json || false;

  if (json) {
    return JSON.stringify(
      {
        roundNumber: round.roundNumber,
        stage: options.stageId,
        timestamp: round.timestamp,
        planner: {
          artifact: round.planner.artifact,
          durationMs: round.planner.durationMs
        },
        reviewer: {
          intent_issues: round.reviewer.intent_issues || [],
          complexity_issues: round.reviewer.complexity_issues || [],
          validity_issues: round.reviewer.validity_issues || [],
          change_summary: round.reviewer.change_summary || [],
          suggested_artifact: round.reviewer.suggested_artifact,
          action_recommendations: round.reviewer.action_recommendations || [],
          durationMs: round.reviewer.durationMs
        },
        proposedArtifact: round.artifactAfter,
        humanInterjection: round.humanInterjection || ""
      },
      null,
      2
    );
  }

  const lines = [
    `=== Round ${round.roundNumber} ===`,
    `Timestamp: ${round.timestamp}`,
    ""
  ];

  if (
    round.reviewer &&
    (round.reviewer.intent_issues ||
      round.reviewer.complexity_issues ||
      round.reviewer.validity_issues)
  ) {
    lines.push("--- Reviewer Issues ---");
    if (round.reviewer.intent_issues && round.reviewer.intent_issues.length) {
      lines.push("Intent Issues:");
      round.reviewer.intent_issues.forEach((issue) => {
        lines.push(`  - ${typeof issue === "string" ? issue : issue.issue}`);
      });
    }
    if (round.reviewer.complexity_issues && round.reviewer.complexity_issues.length) {
      lines.push("Complexity Issues:");
      round.reviewer.complexity_issues.forEach((issue) => {
        lines.push(`  - ${typeof issue === "string" ? issue : issue.issue}`);
      });
    }
    if (round.reviewer.validity_issues && round.reviewer.validity_issues.length) {
      lines.push("Validity Issues:");
      round.reviewer.validity_issues.forEach((issue) => {
        lines.push(`  - ${typeof issue === "string" ? issue : issue.issue}`);
      });
    }
    if (round.reviewer.action_recommendations && round.reviewer.action_recommendations.length) {
      lines.push("Action Recommendations:");
      round.reviewer.action_recommendations.forEach((action) => {
        lines.push(
          `  - ${action.action_type || action.actionType} | ${action.file_id || action.fileId || action.item_id || action.itemId} | ${action.approval_status || action.approvalStatus || "approved"}`
        );
      });
    }
    lines.push("");
  }

  if (round.reviewer && round.reviewer.change_summary) {
    lines.push("--- Proposed Changes ---");
    if (round.reviewer.change_summary.length) {
      round.reviewer.change_summary.forEach((change) => {
        lines.push(`  - ${change}`);
      });
    }
    lines.push("");
  }

  lines.push(
    `Duration: ${(round.planner.durationMs / 1000).toFixed(1)}s (planner) + ${(round.reviewer.durationMs / 1000).toFixed(1)}s (reviewer)`
  );

  return lines.join("\n");
}

// warehouse:method
// responsibility: Logs exit message and terminates process
// actor: cli
// role: process_terminator
// source_truth: implementation
function exit(code, message = null) {
  if (message) {
    if (code === 0) {
      console.log(message);
    } else {
      console.error(message);
    }
  }
  process.exit(code);
}

module.exports = {
  renderSession,
  renderRound,
  renderArtifact,
  exit
};
