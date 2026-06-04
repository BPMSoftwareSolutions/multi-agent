// warehouse:file
// responsibility: Orchestrates postJson, testKey and related operations
// actor: cli
// role: orchestrator
// source_truth: implementation

// Test language model API keys and models to validate quota and performance

const https = require("https");
const path = require("path");
const fs = require("fs");

const root = path.resolve(__dirname, "..");
for (const name of [".env.local", ".env"]) {
  const p = path.join(root, name);
  if (fs.existsSync(p)) require("dotenv").config({ path: p });
}

const TEST_KEYS = {
  "LOC_GEMINI_API_KEY": process.env.LOC_GEMINI_API_KEY,
  "GOOGLE_API_KEY": process.env.GOOGLE_API_KEY,
};

const TEST_MODELS = ["gemini-2.5-flash", "gemini-2.5-pro"];

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
// responsibility: Language model API validator: sends JSON POST request with timeout handling and error parsing
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
// responsibility: Language model API validator: validates API key and model with quota/latency diagnostics
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

// warehouse:method
// responsibility: Orchestrates validation workflow: tests all key-model combinations and renders report
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function main() {
  console.log("🔑 Language Model API Key Tester\n");
  console.log("Testing API keys and models...\n");

  const results = [];
  for (const [keyName, keyValue] of Object.entries(TEST_KEYS)) {
    for (const model of TEST_MODELS) {
      const result = await testKey(keyName, keyValue, model);
      results.push(result);
    }
  }

  console.log("═════════════════════════════════════════════════════════════════════════");
  console.log("Results:");
  console.log("═════════════════════════════════════════════════════════════════════════\n");

  for (const result of results) {
    const emoji = result.status === "OK" ? "✅" : result.status === "QUOTA" ? "❌" : result.status === "SKIP" ? "⏭️ " : "⚠️ ";
    const latency = result.latencyMs ? ` (${result.latencyMs}ms)` : "";
    console.log(`${emoji} ${result.keyName.padEnd(20)} | ${result.model.padEnd(20)} | ${result.status.padEnd(6)} ${latency}`);
    if (result.message) {
      console.log(`   └─ ${result.message}\n`);
    }
  }

  // Summary
  const ok = results.filter((r) => r.status === "OK");
  const quota = results.filter((r) => r.status === "QUOTA");
  const errors = results.filter((r) => r.status === "ERROR");

  console.log("═════════════════════════════════════════════════════════════════════════");
  console.log(`Summary: ${ok.length} OK, ${quota.length} QUOTA, ${errors.length} ERROR\n`);

  if (ok.length > 0) {
    console.log("✅ Recommended configuration:");
    const bestFlash = ok.find((r) => r.model === "gemini-2.5-flash");
    const bestPro = ok.find((r) => r.model === "gemini-2.5-pro");
    if (bestFlash) {
      console.log(`   Primary: ${bestFlash.keyName} with ${bestFlash.model}`);
    }
    if (bestPro) {
      console.log(`   Fallback: ${bestPro.keyName} with ${bestPro.model}`);
    }
  }

  if (quota.length > 0) {
    console.log("\n⚠️  Quota exhausted on:");
    quota.forEach((r) => console.log(`   - ${r.keyName} / ${r.model}`));
  }

  process.exit(errors.length > 0 && ok.length === 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("Fatal error:", e.message);
  process.exit(1);
});
