// warehouse:file
// responsibility: Handles artifact acceptance and action recommendation queueing
// actor: orchestration
// role: artifact_acceptance
// source_truth: implementation

const { queueActionRecommendations } = require("../../shared/actions");

// warehouse:method
// responsibility: Manages artifact acceptance and stage progression: accepts proposed artifact and queues action recommendations
// actor: orchestration
// role: artifact_acceptance
// source_truth: implementation
async function acceptArtifact(session) {
  const stageId = session.currentStage;
  const stageState = session.stages[stageId];

  if (!stageState.proposedArtifact) {
    throw new Error("No proposed artifact to accept");
  }

  stageState.artifact = JSON.parse(JSON.stringify(stageState.proposedArtifact));
  stageState.proposedArtifact = null;
  stageState.accepted = true;

  const latestRound = stageState.rounds[stageState.rounds.length - 1] || null;
  const queueSummary = queueActionRecommendations(
    session,
    latestRound && latestRound.reviewer ? latestRound.reviewer.action_recommendations : [],
    {
      stageId,
      roundNumber: latestRound ? latestRound.roundNumber : null,
      approvedBy: "reviewer+human_accept"
    }
  );

  return {
    artifact: stageState.artifact,
    queueSummary
  };
}

module.exports = { acceptArtifact };
