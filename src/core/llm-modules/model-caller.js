// warehouse:file
// responsibility: Invokes Claude API with system prompt and message chain
// actor: core_runtime
// role: model_invoker
// source_truth: implementation

const { fetchFromAnthropicRaw } = require("./http-transport");
const { getApiKey } = require("./api-key-resolver");

const model = process.env.MODEL || "claude-sonnet-4-6";

// warehouse:method
// responsibility: Invokes Claude API with system prompt and messages, extracting text from response
// actor: core_runtime
// role: model_invoker
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
