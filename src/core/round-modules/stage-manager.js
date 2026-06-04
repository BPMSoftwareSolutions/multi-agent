// warehouse:file
// responsibility: Manages artifact acceptance and stage progression
// actor: orchestration
// role: artifact_acceptance, stage_progression
// source_truth: implementation

const { queueActionRecommendations } = require("../../shared/actions");

// warehouse:method
// responsibility: Manages artifact acceptance and stage progression: accepts proposed artifact and queues action recommendations
// actor: method_implementation
// role: implementation
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

// warehouse:method
// responsibility: Manages artifact acceptance and stage progression: advances session to next stage after validating acceptance
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function advanceStage(session) {
  const { STAGE_ORDER } = require("../stages");
  const currentIndex = STAGE_ORDER.indexOf(session.currentStage);

  if (currentIndex === -1 || currentIndex >= STAGE_ORDER.length - 1) {
    throw new Error("Cannot advance from the final stage");
  }

  if (!session.stages[session.currentStage].accepted) {
    throw new Error("Current stage artifact must be accepted before advancing");
  }

  const nextStageId = STAGE_ORDER[currentIndex + 1];
  session.currentStage = nextStageId;

  return nextStageId;
}

module.exports = {
  acceptArtifact,
  advanceStage
};
