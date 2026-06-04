// warehouse:file
// responsibility: Orchestrates Claude API invocation and response text extraction by delegating to specialized modules
// actor: core_runtime
// role: model_orchestrator
// source_truth: implementation

const { invokeModel } = require("./model-invoker");
const { extractTextFromResponse } = require("./response-extractor");

// warehouse:method
// responsibility: Invokes Claude API with system context and user messages, extracts and returns response text
// actor: core_runtime
// role: model_orchestrator
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
