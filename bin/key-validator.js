// warehouse:file
// responsibility: Sends JSON POST request with timeout handling and error parsing and Validates API key and model with quota/latency diagnostics
// actor: api_validator
// role: validator
// source_truth: implementation

const https = require("https");

// Simple test prompt that's small and fast
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
// responsibility: Sends JSON POST request with timeout handling and error parsing and Validates API key and model with quota/latency diagnostics
// actor: method_implementation
// role: implementation
// source_truth: implementation
function postJson(url, body, timeoutMs = 10000) {
  const bodyStr = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          "content-length": Buffer.byteLength(bodyStr),
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
            reject(new Error(`Failed to parse response: ${e.message}`));
          }
        });
      }
    );
    req.on("error", reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error(`Request timed out after ${timeoutMs}ms`));
    });
    req.write(bodyStr);
    req.end();
  });
}

// warehouse:method
// responsibility: Sends JSON POST request with timeout handling and error parsing and Validates API key and model with quota/latency diagnostics
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
