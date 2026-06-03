const express = require("express");

const { createSession, getSession } = require("../session/store");
const { requireString } = require("../middleware/validate");
const { buildIntentPrompt } = require("../prompts/intent");
const { callClaudeWithRetry } = require("../llm/client");
const {
  getCurrentSessionId,
  listSessions
} = require("../../src/core/session-store");
const { summarizeOperations } = require("../../src/shared/actions");

const router = express.Router();

function fallbackIntent(brief) {
  return {
    task_definition: brief,
    success_criteria: [],
    constraints: [],
    open_questions: []
  };
}

router.post("/start", async (req, res, next) => {
  try {
    const briefError = requireString(req.body, "brief");
    if (briefError) {
      res.status(400).json({ error: briefError });
      return;
    }

    const brief = req.body.brief.trim();
    const requestApiKey =
      typeof req.headers["x-anthropic-api-key"] === "string"
        ? req.headers["x-anthropic-api-key"].trim()
        : "";

    let intent = fallbackIntent(brief);
    try {
      const prompt = buildIntentPrompt({ brief });
      const modelIntent = await callClaudeWithRetry({
        system: prompt.system,
        userMessages: prompt.messages,
        maxTokens: Number(process.env.MAX_TOKENS_INTENT || 512),
        apiKey: requestApiKey || undefined
      });

      intent = {
        task_definition: modelIntent.task_definition || brief,
        success_criteria: Array.isArray(modelIntent.success_criteria)
          ? modelIntent.success_criteria
          : [],
        constraints: Array.isArray(modelIntent.constraints)
          ? modelIntent.constraints
          : [],
        open_questions: Array.isArray(modelIntent.open_questions)
          ? modelIntent.open_questions
          : []
      };
    } catch (_intentError) {
      // Fall back to deterministic intent if model call is unavailable.
    }

    const session = createSession(brief, intent);
    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", (req, res) => {
  const session = getSession(req.params.id);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  res.json(session);
});

router.get("/", (_req, res) => {
  const sessionIds = listSessions();
  const sessions = sessionIds
    .map((id) => getSession(id))
    .filter(Boolean)
    .map((session) => ({
      id: session.id,
      brief: session.brief,
      currentStage: session.currentStage,
      completed: session.completed,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      operations: summarizeOperations(session)
    }));

  res.json({
    currentSessionId: getCurrentSessionId(),
    sessions
  });
});

module.exports = router;
