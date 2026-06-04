// warehouse:file
// responsibility: Formats status output as JSON for CLI display
// actor: cli
// role: renderer
// source_truth: implementation

// warehouse:method
// responsibility: Formats session status summary as JSON
// actor: method_implementation
// role: implementation
// source_truth: implementation
function renderStatusOutput(session, operations) {
  const stageState = session.stages[session.currentStage];
  return JSON.stringify(
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
  );
}

module.exports = { renderStatusOutput };
