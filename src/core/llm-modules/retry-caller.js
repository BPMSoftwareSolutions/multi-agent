// warehouse:file
// responsibility: Calls language model APIs with JSON parsing retry and repair logic
// actor: core_runtime
// role: retry_orchestrator
// source_truth: implementation

const { callClaude } = require("./model-caller");
const { extractJSON } = require("./json-extractor");

// warehouse:method
// responsibility: Calls Claude and retries on JSON parse errors up to maxAttempts, appending repair prompts to message chain
// actor: core_runtime
// role: retry_orchestrator
// source_truth: implementation
async function callClaudeWithRetry(params, maxAttempts = 2) {
  const messages = [...(params.userMessages || [])];
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let outputText = "";
    try {
      outputText = await callClaude({
        system: params.system,
        userMessages: messages,
        maxTokens: params.maxTokens,
        apiKey: params.apiKey
      });
      return extractJSON(outputText);
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts) {
        break;
      }

      const isJsonParseError =
        typeof error.message === "string" &&
        (error.message.includes("Could not extract JSON") ||
          error.message.includes("Unexpected token") ||
          error.message.includes("Expected ','") ||
          error.message.includes("JSON at position"));

      if (!isJsonParseError) {
        break;
      }

      if (outputText) {
        messages.push({ role: "assistant", content: outputText });
      }

      messages.push({
        role: "user",
        content:
          "Your previous response could not be parsed as JSON. Repair it and return only valid JSON matching the required schema, with no markdown, no comments, and no trailing commas."
      });
    }
  }

  throw lastError;
}

module.exports = { callClaudeWithRetry };
