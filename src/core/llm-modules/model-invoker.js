// warehouse:file
// responsibility: Calls language model API with system prompt and user messages, returns response
// actor: core_runtime
// role: model_invoker
// source_truth: implementation

const { fetchFromAnthropicRaw } = require("./http-transport");
const { getApiKey } = require("./api-key-resolver");

const model = process.env.MODEL || "claude-sonnet-4-6";

// warehouse:method
// responsibility: Calls language model API with system prompt and user messages, returns response
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function invokeModel({ system, userMessages, maxTokens, apiKey }) {
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

  return response;
}

module.exports = { invokeModel };
