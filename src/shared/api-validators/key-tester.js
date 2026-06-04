// warehouse:file
// responsibility: Tests single API key and model, returns diagnostic result with status, latency, and error details
// actor: api_validator
// role: tester
// source_truth: implementation

const { postJson } = require("./http-client");

// Test prompt that's small and fast
const TEST_PROMPT = {
  systemInstruction: { parts: [{ text: "You are a helpful assistant. Respond with valid JSON only." }] },
  contents: [{ role: "user", parts: [{ text: "Return {\"test\": \"ok\", \"timestamp\": \"" + new Date().toISOString() + "\"}. Nothing else." }] }],
  generationConfig: {
    temperature: 0,
    responseMimeType: "application/json",
    maxOutputTokens: 100,
  },
};

// warehouse:method
// responsibility: Tests single API key and model, returns diagnostic result with status, latency, and error details
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function testKey(keyName, keyValue, model) {
  if (!keyValue) {
    return {
      keyName,
      model,
      status: "SKIP",
      message: "Key not set",
    };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${keyValue}`;
  const startTime = Date.now();

  try {
    await postJson(url, TEST_PROMPT, 15000);
    const elapsed = Date.now() - startTime;
    return {
      keyName,
      model,
      status: "OK",
      latencyMs: elapsed,
      message: "Success",
    };
  } catch (error) {
    const elapsed = Date.now() - startTime;
    const msg = error.message || String(error);
    const isQuota =
      error.status === 429 ||
      msg.toLowerCase().includes("quota") ||
      msg.toLowerCase().includes("exceeded");

    return {
      keyName,
      model,
      status: isQuota ? "QUOTA" : "ERROR",
      latencyMs: elapsed,
      statusCode: error.status,
      message: msg.split("\n")[0].substring(0, 120),
    };
  }
}

module.exports = { testKey };
