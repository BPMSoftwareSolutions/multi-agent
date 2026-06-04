// warehouse:file
// responsibility: Coordinates stage module behavior with documented file taxonomy evidence
// actor: server_runtime
// role: runtime_component
// source_truth: implementation

const express = require("express");

const { getSession, touchSession } = require("../session/store");
const { requireString } = require("../middleware/validate");
const { STAGE_ORDER } = require("../config/stages");

const router = express.Router();

router.post("/advance", (req, res) => {
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

  if (session.completed) {
    res.status(400).json({ error: "Session is already completed" });
    return;
  }

  const currentIndex = STAGE_ORDER.indexOf(session.currentStage);
  if (currentIndex === -1) {
    res.status(400).json({ error: "Current stage is invalid" });
    return;
  }

  const currentStageState = session.stages[session.currentStage];
  if (!currentStageState.accepted) {
    res.status(400).json({
      error: "Current stage must be accepted before advancing"
    });
    return;
  }

  const nextStage = STAGE_ORDER[currentIndex + 1];
  if (!nextStage) {
    session.completed = true;
    touchSession(session.id);
    res.json({ currentStage: session.currentStage, completed: true, session });
    return;
  }

  session.currentStage = nextStage;
  touchSession(session.id);

  res.json({ currentStage: nextStage, completed: false, session });
});

module.exports = router;
