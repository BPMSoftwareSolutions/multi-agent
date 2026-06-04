// warehouse:file
// responsibility: Delegates model calling to focused modules; orchestrates invocation and response extraction
// actor: core_runtime
// role: model_caller_delegator
// source_truth: implementation

const { invokeModel } = require("./model-invoker");
const { extractTextFromResponse } = require("./response-extractor");

// warehouse:method
// responsibility: Calls Claude API with system prompt and messages, returns extracted text response
// actor: core_runtime
// role: model_caller_delegator
// source_truth: implementation
async function callClaude({ system, userMessages, maxTokens, apiKey }) {
  const response = await invokeModel({
    system,
    userMessages,
    maxTokens,
    apiKey
  });

  return extractTextFromResponse(response);
}

module.exports = { callClaude };
