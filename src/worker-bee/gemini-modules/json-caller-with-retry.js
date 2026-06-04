// warehouse:file
// responsibility: Calls language model with automatic retry, exponential backoff, temperature variation, and fallback strategy
// actor: worker_bee_infrastructure
// role: retry_orchestrator
// source_truth: implementation

const { callGemini, DEFAULT_MODEL } = require("./gemini-caller");
const { extractJSON } = require("./json-extractor");
const { isRetryable, getBackoffDelay } = require("./retry-logic");

// warehouse:method
// responsibility: Calls language model with automatic retry, exponential backoff, temperature variation, and fallback strategy
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function callGeminiJSON(params, maxAttempts = 5) {
  let lastError;
  const startTime = Date.now();
  let currentModel = params.model || DEFAULT_MODEL;
  let fallbackAttempted = false;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const temperature = attempt === 1 ? 0 : Math.min(0.2 + 0.2 * attempt, 0.8);
      const text = await callGemini({ ...params, model: currentModel, temperature });
      return extractJSON(text);
    } catch (error) {
      lastError = error;
      const elapsed = Date.now() - startTime;
      const errorMsg = (error.message || '').toLowerCase();
      const isQuotaError = (error.status === 429 || error.status === 403) &&
        (errorMsg.includes('quota') || errorMsg.includes('exceeded') || errorMsg.includes('resource'));

      if (isQuotaError && !fallbackAttempted && currentModel === DEFAULT_MODEL) {
        fallbackAttempted = true;
        console.error(`[callGeminiJSON] Flash quota/rate limit hit, falling back to Pro`);
        currentModel = 'gemini-2.5-pro';
        continue;
      }

      console.error(`[callGeminiJSON] attempt ${attempt}/${maxAttempts} (model: ${currentModel}) failed after ${elapsed}ms: ${error.message}`);
      if (attempt >= maxAttempts || !isRetryable(error)) {
        console.error(`[callGeminiJSON] exhausted retries or non-retryable error, giving up`);
        break;
      }
      const delay = getBackoffDelay(attempt);
      console.error(`[callGeminiJSON] retrying in ${delay}ms (attempt ${attempt + 1}/${maxAttempts})`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}

module.exports = { callGeminiJSON };
