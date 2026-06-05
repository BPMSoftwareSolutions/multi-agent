// warehouse:file
// responsibility: Renders test results with status indicators and detailed diagnostics and Computes and displays test summary with recommendations
// actor: method_implementation
// role: implementation
// source_truth: implementation

// warehouse:method
// responsibility: Renders test results with status indicators and detailed diagnostics and Computes and displays test summary with recommendations
// actor: method_implementation
// role: implementation
// source_truth: implementation
function displayResults(results) {
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
}

// warehouse:method
// responsibility: Renders test results with status indicators and detailed diagnostics and Computes and displays test summary with recommendations
// actor: method_implementation
// role: implementation
// source_truth: implementation
function displaySummary(results) {
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

  return errors.length > 0 && ok.length === 0 ? 1 : 0;
}

module.exports = { displayResults, displaySummary };
