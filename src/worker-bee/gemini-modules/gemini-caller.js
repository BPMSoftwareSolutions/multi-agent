// warehouse:file
// responsibility: Orchestrates Gemini API calls with retry, backoff, temperature variation, and model fallback
// actor: worker_bee_infrastructure
// role: orchestrator
// source_truth: implementation

const { postJson } = require("./http-client");
const { extractJSON } = require("./json-extractor");
const { getApiKey } = require("./api-key-resolver");
const { isRetryable, getBackoffDelay } = require("./retry-logic");

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// warehouse:method
// responsibility: Calls Gemini API with system instruction and user prompt, extracting text from response
// actor: worker_bee_infrastructure
// role: api_caller
// source_truth: implementation
async function callGemini({ system, user, apiKey, model, maxTokens, temperature = 0 }) {
  const key = getApiKey(apiKey);
  const useModel = model || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${useModel}:generateContent?key=${key}`;

  const payload = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: user }] }],
    generationConfig: {
      temperature,
      responseMimeType: "application/json",
      maxOutputTokens: maxTokens || 4096,
    },
  };

  const response = await postJson(url, payload);
  const text = (response.candidates || [])
    .flatMap((c) => c.content?.parts || [])
    .map((p) => p.text || "")
    .join("")
    .trim();

  if (!text) {
    const reason = response.candidates?.[0]?.finishReason || "empty response";
    throw new Error(`Gemini returned no text (${reason})`);
  }
  return text;
}

// warehouse:method
// responsibility: Calls Gemini with automatic retry, exponential backoff, temperature variation, and Flash→Pro quota fallback
// actor: worker_bee_infrastructure
// role: orchestrator
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

module.exports = { callGemini, callGeminiJSON, DEFAULT_MODEL };
