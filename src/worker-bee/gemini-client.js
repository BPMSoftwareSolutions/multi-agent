// warehouse:file
// responsibility: Manages Gemini API communication: resolves keys, sends JSON POST requests with timeout handling, extracts JSON from responses, determines retry eligibility, implements exponential backoff retry loop
// actor: worker_bee_infrastructure
// role: api_client
// source_truth: implementation

// Minimal Gemini (Google AI Studio) client for the worker-bee.
//
// Uses the Generative Language REST API with an API key, mirroring the thin
// https style of src/core/llm-client.js. Swap the endpoint/auth here if you move
// to Vertex AI later; nothing else in the worker-bee depends on the transport.

const https = require("https");

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// warehouse:method
// responsibility: Resolves Gemini API key from override or environment variables
// actor: worker_bee_infrastructure
// role: infrastructure
// source_truth: implementation
function getApiKey(override) {
  const key =
    override ||
    process.env.LOC_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY;
  if (!key) {
    throw new Error("LOC_GEMINI_API_KEY (or GEMINI_API_KEY / GOOGLE_API_KEY) is not set");
  }
  return key;
}

// warehouse:method
// responsibility: Extracts JSON from model output, handling bare JSON, markdown fence blocks, and substring ranges
// actor: worker_bee_infrastructure
// role: infrastructure
// source_truth: implementation
function extractJSON(text) {
  if (typeof text !== "string") throw new Error("Model output is not text");
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch (_e) {
    /* fall through */
  }
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch (_e) {
      /* fall through */
    }
  }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end !== -1) {
    return JSON.parse(trimmed.slice(start, end + 1));
  }
  throw new Error("Could not extract JSON from model output");
}

// warehouse:method
// responsibility: Sends JSON POST request to URL with configurable timeout and error handling
// actor: worker_bee_infrastructure
// role: api_client
// source_truth: implementation
function postJson(url, payload, timeoutMs = 30000) {
  const body = JSON.stringify(payload);
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          "content-length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode >= 400) {
            let message = `HTTP ${res.statusCode}`;
            try {
              message = JSON.parse(data).error?.message || message;
            } catch (_e) {
              /* keep default */
            }
            const err = new Error(message);
            err.status = res.statusCode;
            reject(err);
            return;
          }
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse Gemini response: ${e.message}`));
          }
        });
      }
    );
    req.on("error", reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error(`API request timed out after ${timeoutMs}ms`));
    });
    req.write(body);
    req.end();
  });
}

// warehouse:method
// responsibility: Calls Gemini API with system instruction and user prompt, extracting text from response
// actor: worker_bee_infrastructure
// role: api_client
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

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504, 529]);

// warehouse:method
// responsibility: Determines whether an error condition should trigger a retry (excluding auth failures)
// actor: worker_bee_infrastructure
// role: infrastructure
// source_truth: implementation
function isRetryable(error) {
  if (error.status === 401 || error.status === 403) return false; // auth: never retry
  if (RETRYABLE_STATUS.has(error.status)) return true;
  const msg = String(error.message || "").toLowerCase();
  return (
    msg.includes("high demand") ||
    msg.includes("overloaded") ||
    msg.includes("try again") ||
    msg.includes("rate") ||
    msg.includes("could not extract json") ||
    msg.includes("unexpected token") ||
    msg.includes("json at position") || // malformed JSON array/object
    msg.includes("expected ','") ||
    msg.includes("expected '") ||
    msg.includes("in json") ||
    msg.includes("no text") || // empty candidate / MAX_TOKENS finish
    msg.includes("timed out") ||
    error.code === "ECONNRESET" ||
    error.code === "ETIMEDOUT"
  );
}

// warehouse:method
// responsibility: Calls Gemini with automatic retry, exponential backoff, temperature variation, and Flash→Pro quota fallback
// actor: worker_bee_infrastructure
// role: api_client
// source_truth: implementation
async function callGeminiJSON(params, maxAttempts = 5) {
  let lastError;
  const startTime = Date.now();
  let currentModel = params.model || DEFAULT_MODEL;
  let fallbackAttempted = false;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      // Retry at a rising temperature: at temp 0 a malformed-JSON generation is
      // deterministic and would just repeat, so retries must vary the sampling.
      const temperature = attempt === 1 ? 0 : Math.min(0.2 + 0.2 * attempt, 0.8);
      const text = await callGemini({ ...params, model: currentModel, temperature });
      return extractJSON(text);
    } catch (error) {
      lastError = error;
      const elapsed = Date.now() - startTime;
      const errorMsg = (error.message || '').toLowerCase();
      const isQuotaError = (error.status === 429 || error.status === 403) &&
        (errorMsg.includes('quota') || errorMsg.includes('exceeded') || errorMsg.includes('resource'));

      // Soft envelope: Flash → Pro fallback on quota exhaustion (happens BEFORE retry logic)
      if (isQuotaError && !fallbackAttempted && currentModel === DEFAULT_MODEL) {
        fallbackAttempted = true;
        console.error(`[callGeminiJSON] Flash quota/rate limit hit, falling back to Pro`);
        currentModel = 'gemini-2.5-pro';
        // Retry immediately with Pro model (don't consume an attempt)
        continue;
      }

      console.error(`[callGeminiJSON] attempt ${attempt}/${maxAttempts} (model: ${currentModel}) failed after ${elapsed}ms: ${error.message}`);
      if (attempt >= maxAttempts || !isRetryable(error)) {
        console.error(`[callGeminiJSON] exhausted retries or non-retryable error, giving up`);
        break;
      }
      // Exponential backoff: ~1s, 2s, 4s, 8s (deterministic, no jitter for observability).
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
      console.error(`[callGeminiJSON] retrying in ${delay}ms (attempt ${attempt + 1}/${maxAttempts})`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}

module.exports = { callGemini, callGeminiJSON, extractJSON, DEFAULT_MODEL };
