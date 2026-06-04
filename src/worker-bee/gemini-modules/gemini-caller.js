// warehouse:file
// responsibility: Calls language model API with system instruction and user prompt, extracting text from response
// actor: worker_bee_infrastructure
// role: api_caller
// source_truth: implementation

const { postJson } = require("./http-client");
const { getApiKey } = require("./api-key-resolver");

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// warehouse:method
// responsibility: Calls language model API with system instruction and user prompt, extracting text from response
// actor: method_implementation
// role: implementation
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

module.exports = { callGemini, DEFAULT_MODEL };
