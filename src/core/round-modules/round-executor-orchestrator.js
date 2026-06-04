// warehouse:file
// responsibility: Orchestrates planner and reviewer agent execution for design workshop rounds
// actor: core_runtime
// role: orchestrator
// source_truth: implementation

const {
  buildBuilderPrompt,
  buildReviewerPrompt
} = require("../prompt-builders");
const { callClaudeWithRetry } = require("../llm-client");
const { normalizeReviewerOutput } = require("./intent-normalizer");
const { createRoundRecord } = require("./round-record-builder");

// warehouse:method
// responsibility: Orchestrates planner and reviewer agent execution for design workshop rounds — function
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function executeRoundAgents({
  session,
  apiKey,
  stageId,
  stageState,
  stageConfig,
  roundNumber,
  humanInterjection = "",
  artifactBefore
}) {
  // Determine max tokens based on stage
  const maxTokensByStage = {
    idea: 4096,
    ascii: 8192,
    plan: 8192
  };
  const maxTokens = maxTokensByStage[stageId] || 4096;

  // Planner
  const builderPrompt = buildBuilderPrompt({
    stage: stageConfig,
    intent: session.intent,
    artifact: stageState.artifact,
    lastRound: stageState.rounds[stageState.rounds.length - 1] || null,
    humanInterjection,
    brief: session.brief,
    roundNumber
  });

  const builderStart = Date.now();
  const builderOutput = await callClaudeWithRetry({
    system: builderPrompt.system,
    userMessages: builderPrompt.messages,
    maxTokens,
    apiKey
  });
  const builderDurationMs = Date.now() - builderStart;

  // Reviewer
  const reviewerPrompt = buildReviewerPrompt({
    stage: stageConfig,
    intent: session.intent,
    artifact: stageState.artifact,
    builderOutput,
    humanInterjection
  });

  const reviewerStart = Date.now();
  const reviewerRaw = await callClaudeWithRetry({
    system: reviewerPrompt.system,
    userMessages: reviewerPrompt.messages,
    maxTokens,
    apiKey
  });
  const reviewerDurationMs = Date.now() - reviewerStart;

  const reviewerOutput = normalizeReviewerOutput(reviewerRaw, builderOutput);

  return {
    builderOutput,
    builderDurationMs,
    reviewerOutput,
    reviewerDurationMs,
    artifactAfter: reviewerOutput.suggested_artifact
  };
}

module.exports = { executeRoundAgents };
