const express = require("express");

const { getSession, touchSession } = require("../session/store");
const { requireString, optionalString } = require("../middleware/validate");
const { STAGES } = require("../config/stages");
const { buildBuilderPrompt } = require("../prompts/builder");
const { buildReviewerPrompt } = require("../prompts/reviewer");
const { callClaudeWithRetry } = require("../llm/client");

const router = express.Router();

function makeTraceId() {
  return `round_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function pushTrace(trace, traceId, step, status, details) {
  const event = {
    ts: new Date().toISOString(),
    step,
    status,
    details: details || ""
  };
  trace.push(event);
  console.log(`[${traceId}] ${step} ${status}${details ? ` - ${details}` : ""}`);
}

function toClientError(error) {
  const message = error && error.message ? String(error.message) : "Unknown LLM error";

  if (message.includes("ANTHROPIC_API_KEY") || message.includes("CLAUDE_API_KEY")) {
    return {
      status: 400,
      message:
        "Missing API key. Set ANTHROPIC_API_KEY or CLAUDE_API_KEY on the server or provide X-Anthropic-Api-Key header from the browser."
    };
  }

  const status = Number(error && (error.status || error.statusCode));
  if (status === 401 || status === 403) {
    return {
      status: 401,
      message: "Invalid or unauthorized Anthropic API key. Update the key and try again."
    };
  }

  if (status === 429) {
    return {
      status: 429,
      message: "Rate limit reached for Anthropic API. Please wait and retry."
    };
  }

  if (
    message.includes("Could not extract JSON from model output") ||
    message.includes("Unexpected token") ||
    message.includes("Expected ','") ||
    message.includes("JSON at position")
  ) {
    return {
      status: 502,
      message: "Model response was not valid JSON for this step. Please retry the round."
    };
  }

  return {
    status: 502,
    message: `Model request failed: ${message}`
  };
}

function normalizeReviewerOutput(output, fallbackArtifact) {
  return {
    intent_issues: Array.isArray(output.intent_issues) ? output.intent_issues : [],
    complexity_issues: Array.isArray(output.complexity_issues) ? output.complexity_issues : [],
    validity_issues: Array.isArray(output.validity_issues) ? output.validity_issues : [],
    change_summary: Array.isArray(output.change_summary) ? output.change_summary : [],
    suggested_artifact: output.suggested_artifact || fallbackArtifact,
    action_recommendations: Array.isArray(output.action_recommendations)
      ? output.action_recommendations.filter((entry) => entry && typeof entry === "object")
      : []
  };
}

router.post("/run", async (req, res, next) => {
  const traceId = makeTraceId();
  const trace = [];
  try {
    pushTrace(trace, traceId, "round", "start", "Received /round/run request");
    const sessionError = requireString(req.body, "sessionId");
    if (sessionError) {
      pushTrace(trace, traceId, "validation", "failed", sessionError);
      res.status(400).json({ error: sessionError });
      return;
    }

    const humanInterjectionError = optionalString(req.body, "humanInterjection");
    if (humanInterjectionError) {
      pushTrace(trace, traceId, "validation", "failed", humanInterjectionError);
      res.status(400).json({ error: humanInterjectionError });
      return;
    }

    const sessionId = req.body.sessionId.trim();
    const humanInterjection = (req.body.humanInterjection || "").trim();
    const requestApiKey =
      typeof req.headers["x-anthropic-api-key"] === "string"
        ? req.headers["x-anthropic-api-key"].trim()
        : "";

    const session = getSession(sessionId);
    if (!session) {
      pushTrace(trace, traceId, "session", "failed", "Session not found");
      res.status(404).json({ error: "Session not found" });
      return;
    }

    if (session.completed) {
      pushTrace(trace, traceId, "session", "failed", "Session is already completed");
      res.status(400).json({ error: "Session is already completed" });
      return;
    }

    const stageId = session.currentStage;
    const stageConfig = STAGES[stageId];
    const stageState = session.stages[stageId];

    if (!stageConfig || !stageState) {
      pushTrace(trace, traceId, "stage", "failed", "Current stage is invalid");
      res.status(400).json({ error: "Current stage is invalid" });
      return;
    }

    if (!requestApiKey && !process.env.ANTHROPIC_API_KEY && !process.env.CLAUDE_API_KEY) {
      pushTrace(trace, traceId, "auth", "failed", "Missing API key");
      res.status(400).json({
        error:
          "Missing API key. Set ANTHROPIC_API_KEY or CLAUDE_API_KEY on the server or provide X-Anthropic-Api-Key from the browser."
      });
      return;
    }

    const lastRound = stageState.rounds[stageState.rounds.length - 1] || null;
    const roundNumber = stageState.rounds.length + 1;
    const artifactBefore = JSON.parse(JSON.stringify(stageState.artifact));

    const builderPrompt = buildBuilderPrompt({
      stage: stageConfig,
      intent: session.intent,
      artifact: stageState.artifact,
      lastRound,
      humanInterjection,
      brief: session.brief,
      roundNumber
    });

    const builderStart = Date.now();
    pushTrace(trace, traceId, "planner", "start", "Calling Planner model");
    const builderOutput = await callClaudeWithRetry({
      system: builderPrompt.system,
      userMessages: builderPrompt.messages,
      maxTokens: stageId === "ascii" ? 8192 : stageId === "plan" ? 8192 : 4096,
      apiKey: requestApiKey || undefined
    });
    pushTrace(trace, traceId, "planner", "ok", `Completed in ${Date.now() - builderStart}ms`);

    const reviewerPrompt = buildReviewerPrompt({
      stage: stageConfig,
      intent: session.intent,
      artifact: stageState.artifact,
      builderOutput,
      humanInterjection
    });

    const reviewerStart = Date.now();
    pushTrace(trace, traceId, "reviewer", "start", "Calling Reviewer model");
    const reviewerRaw = await callClaudeWithRetry({
      system: reviewerPrompt.system,
      userMessages: reviewerPrompt.messages,
      maxTokens: stageId === "ascii" ? 8192 : stageId === "plan" ? 8192 : 4096,
      apiKey: requestApiKey || undefined
    });
    pushTrace(trace, traceId, "reviewer", "ok", `Completed in ${Date.now() - reviewerStart}ms`);

    const reviewerOutput = normalizeReviewerOutput(reviewerRaw, builderOutput);

    const round = {
      roundNumber,
      timestamp: new Date().toISOString(),
      humanInterjection,
      artifactBefore,
      planner: { artifact: builderOutput },
      reviewer: reviewerOutput,
      artifactAfter: reviewerOutput.suggested_artifact
    };

    stageState.rounds.push(round);
    stageState.proposedArtifact = reviewerOutput.suggested_artifact;
    touchSession(session.id);
    pushTrace(trace, traceId, "round", "ok", `Round ${roundNumber} stored successfully`);

    res.json({
      traceId,
      trace,
      roundNumber,
      planner: round.planner,
      reviewer: round.reviewer,
      proposedArtifact: round.artifactAfter
    });
  } catch (error) {
    const clientError = toClientError(error);
    pushTrace(trace, traceId, "round", "failed", clientError.message);
    res.status(clientError.status).json({ error: clientError.message, traceId, trace });
  }
});

module.exports = router;
