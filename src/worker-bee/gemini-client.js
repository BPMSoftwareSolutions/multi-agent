// Minimal Gemini (Google AI Studio) client for the worker-bee.
//
// Uses the Generative Language REST API with an API key, mirroring the thin
// https style of src/core/llm-client.js. Swap the endpoint/auth here if you move
// to Vertex AI later; nothing else in the worker-bee depends on the transport.

const https = require("https");

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

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

function postJson(url, payload) {
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
    req.write(body);
    req.end();
  });
}

// Call Gemini with a system instruction + user prompt, requesting JSON output.
async function callGemini({ system, user, apiKey, model, maxTokens }) {
  const key = getApiKey(apiKey);
  const useModel = model || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${useModel}:generateContent?key=${key}`;

  const payload = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: user }] }],
    generationConfig: {
      temperature: 0,
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
    msg.includes("timed out") ||
    error.code === "ECONNRESET" ||
    error.code === "ETIMEDOUT"
  );
}

async function callGeminiJSON(params, maxAttempts = 5) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const text = await callGemini(params);
      return extractJSON(text);
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts || !isRetryable(error)) break;
      // Exponential backoff with jitter: ~1s, 2s, 4s, 8s.
      const delay = Math.min(1000 * 2 ** (attempt - 1), 8000) + Math.floor(Math.random() * 400);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}

module.exports = { callGemini, callGeminiJSON, extractJSON, DEFAULT_MODEL };
