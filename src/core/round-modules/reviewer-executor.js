// warehouse:file
// responsibility: Builds reviewer prompt, invokes Claude to evaluate artifact, and normalizes output
// actor: core_runtime
// role: executor
// source_truth: implementation

const { buildReviewerPrompt } = require("../prompt-builders");
const { callClaudeWithRetry } = require("../llm-client");
const { normalizeReviewerOutput } = require("./intent-normalizer");

// warehouse:method
// responsibility: Builds reviewer prompt, invokes Claude to evaluate artifact, and normalizes output
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function executeReviewer({
  stageConfig,
  session,
  stageState,
  builderOutput,
  maxTokens,
  apiKey
}) {
  const reviewerPrompt = buildReviewerPrompt({
    stage: stageConfig,
    intent: session.intent,
    artifact: stageState.artifact,
    builderOutput,
    humanInterjection: session.humanInterjection || ""
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

  return { reviewerOutput, reviewerDurationMs };
}

module.exports = { executeReviewer };
