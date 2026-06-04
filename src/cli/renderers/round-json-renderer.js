// warehouse:file
// responsibility: Renders round results to JSON format for machine-readable output
// actor: cli
// role: renderer
// source_truth: implementation

// warehouse:method
// responsibility: Renders round results to JSON format for machine-readable output
// actor: method_implementation
// role: implementation
// source_truth: implementation
function renderRoundJson(round, options = {}) {
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

module.exports = { renderRoundJson };
