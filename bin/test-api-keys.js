// warehouse:file
// responsibility: Orchestrates validation workflow: tests all key-model combinations and renders report
// actor: cli
// role: orchestrator
// source_truth: implementation

// Test language model API keys and models to validate quota and performance

const path = require("path");
const fs = require("fs");
const { testKey } = require("./key-validator");
const { displayResults, displaySummary } = require("./test-result-formatter");

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

  displayResults(results);
  const exitCode = displaySummary(results);
  process.exit(exitCode);
}

main().catch((e) => {
  console.error("Fatal error:", e.message);
  process.exit(1);
});
