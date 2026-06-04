// warehouse:file
// responsibility: Coordinates artifact module behavior with documented file taxonomy evidence
// actor: server_runtime
// role: runtime_component
// source_truth: implementation

const express = require("express");

const { getSession, touchSession } = require("../session/store");
const { requireString } = require("../middleware/validate");
const { queueActionRecommendations } = require("../../src/shared/actions");

const router = express.Router();

router.post("/accept", (req, res) => {
  const sessionError = requireString(req.body, "sessionId");
  if (sessionError) {
    res.status(400).json({ error: sessionError });
    return;
  }

  const sessionId = req.body.sessionId.trim();
  const session = getSession(sessionId);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const stageId = session.currentStage;
  const stageState = session.stages[stageId];
  if (!stageState) {
    res.status(400).json({ error: "Current stage is invalid" });
    return;
  }

  const latestRound = stageState.rounds[stageState.rounds.length - 1] || null;
  const acceptedArtifact = stageState.proposedArtifact || latestRound?.artifactAfter || null;

  if (!acceptedArtifact) {
    res.status(400).json({ error: "No proposed artifact available to accept" });
    return;
  }

  stageState.artifact = acceptedArtifact;
  stageState.accepted = true;
  stageState.proposedArtifact = null;

  const queueSummary = queueActionRecommendations(
    session,
    latestRound && latestRound.reviewer ? latestRound.reviewer.action_recommendations : [],
    {
      stageId,
      roundNumber: latestRound ? latestRound.roundNumber : null,
      approvedBy: "reviewer+human_accept"
    }
  );
  touchSession(session.id);

  res.json({
    currentStage: stageId,
    artifact: stageState.artifact,
    accepted: stageState.accepted,
    queueSummary,
    session
  });
});

module.exports = router;
