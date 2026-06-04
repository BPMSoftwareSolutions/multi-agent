// warehouse:file
// responsibility: Renders round results to human-readable text format for CLI display
// actor: cli
// role: renderer
// source_truth: implementation

// warehouse:method
// responsibility: Renders round results to human-readable text format for CLI display
// actor: method_implementation
// role: implementation
// source_truth: implementation
function renderRoundText(round) {
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

module.exports = { renderRoundText };
