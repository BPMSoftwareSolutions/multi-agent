// warehouse:file
// responsibility: Builds planner prompt and invokes Claude to generate artifact proposal
// actor: core_runtime
// role: executor
// source_truth: implementation

const { buildBuilderPrompt } = require("../prompt-builders");
const { callClaudeWithRetry } = require("../llm-client");

// warehouse:method
// responsibility: Builds planner prompt and invokes Claude to generate artifact proposal
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function executePlanner({
  stageConfig,
  session,
  stageState,
  roundNumber,
  maxTokens,
  apiKey
}) {
  const builderPrompt = buildBuilderPrompt({
    stage: stageConfig,
    intent: session.intent,
    artifact: stageState.artifact,
    lastRound: stageState.rounds[stageState.rounds.length - 1] || null,
    humanInterjection: session.humanInterjection || "",
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

  return { builderOutput, builderDurationMs };
}

module.exports = { executePlanner };
