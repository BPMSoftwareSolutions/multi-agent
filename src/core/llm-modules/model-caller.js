// warehouse:file
// responsibility: Calls Claude API with prompts, extracts response text from result
// actor: core_runtime
// role: model_orchestrator
// source_truth: implementation

const { fetchFromAnthropicRaw } = require("./http-transport");
const { getApiKey } = require("./api-key-resolver");

const model = process.env.MODEL || "claude-sonnet-4-6";

// warehouse:method
// responsibility: Calls Claude API with prompts, extracts response text from result
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function callClaude({ system, userMessages, maxTokens, apiKey }) {
  const key = getApiKey(apiKey);

  const response = await fetchFromAnthropicRaw(
    "https://api.anthropic.com/v1/messages",
    "POST",
    {
      model,
      max_tokens: maxTokens,
      system,
      messages: userMessages
    },
    key
  );

  const text = (response.content || [])
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("\n")
    .trim();

  return text;
}

module.exports = { callClaude };
