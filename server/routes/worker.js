const express = require("express");

const { getSession, touchSession } = require("../session/store");
const { requireString, optionalString } = require("../middleware/validate");
const { runWorker } = require("../../src/shared/actions");
const { executeDriveWorker } = require("../drive/service");

const router = express.Router();

router.post("/run", async (req, res, next) => {
  try {
    const sessionError = requireString(req.body, "sessionId");
    if (sessionError) {
      res.status(400).json({ error: sessionError });
      return;
    }

    const actionIdError = optionalString(req.body, "actionId");
    if (actionIdError) {
      res.status(400).json({ error: actionIdError });
      return;
    }

    const sessionId = req.body.sessionId.trim();
    const session = getSession(sessionId);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const result = await runWorker(session, {
      actionId: req.body.actionId ? req.body.actionId.trim() : undefined,
      actor: "server_worker",
      executeExternalAction: ({ session: currentSession, action, actor }) =>
        executeDriveWorker(currentSession, { actionId: action.actionId, actor })
    });

    touchSession(session.id);

    if (!result.ok) {
      const status =
        result.code === "action_not_found" || result.code === "no_pending_actions" ? 400 : 409;
      res.status(status).json({ error: result.message, result, session });
      return;
    }

    res.json({ result, session });
  } catch (error) {
    next(error);
  }
});

module.exports = router;