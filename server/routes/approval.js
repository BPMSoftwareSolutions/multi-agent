const express = require("express");

const { getSession, touchSession } = require("../session/store");
const { requireString } = require("../middleware/validate");
const { approveManualAction } = require("../../src/shared/actions");

const router = express.Router();

router.post("/action", (req, res) => {
  const sessionError = requireString(req.body, "sessionId");
  if (sessionError) {
    res.status(400).json({ error: sessionError });
    return;
  }

  const session = getSession(req.body.sessionId.trim());
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const recommendation = req.body.recommendation && typeof req.body.recommendation === "object"
    ? req.body.recommendation
    : req.body;

  const summary = approveManualAction(session, recommendation, {
    stageId: session.currentStage,
    roundNumber: session.stages[session.currentStage].rounds.length,
    approvedBy: "manual_api"
  });

  touchSession(session.id);
  res.status(201).json({ ok: true, summary, session });
});

module.exports = router;