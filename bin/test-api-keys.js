#!/usr/bin/env node
// warehouse:file
// responsibility: Orchestrates API key validation across configured keys and models, delegates to focused modules
// actor: cli
// role: orchestrator
// source_truth: implementation

const path = require("path");
const fs = require("fs");
const { testKey } = require("../src/shared/api-validators/key-tester");
const { formatReport, formatSummary, getExitCode } = require("../src/shared/api-validators/report-formatter");

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
// actor: cli
// role: orchestrator
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

  console.log(formatReport(results));
  console.log(formatSummary(results));

  process.exit(getExitCode(results));
}

main().catch((e) => {
  console.error("Fatal error:", e.message);
  process.exit(1);
});
