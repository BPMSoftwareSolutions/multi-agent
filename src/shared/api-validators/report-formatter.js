// warehouse:file
// responsibility: Formats diagnostic results and renders human-readable API validation report with summary
// actor: report_formatter
// role: output_renderer
// source_truth: implementation

// warehouse:method
// responsibility: Generates formatted report from diagnostic results with detailed status, latency, and recommendations
// actor: report_formatter
// role: output_renderer
// source_truth: implementation
function formatReport(results) {
  const output = [];

  output.push("═════════════════════════════════════════════════════════════════════════");
  output.push("Results:");
  output.push("═════════════════════════════════════════════════════════════════════════\n");

  for (const result of results) {
    const emoji = result.status === "OK" ? "✅" : result.status === "QUOTA" ? "❌" : result.status === "SKIP" ? "⏭️ " : "⚠️ ";
    const latency = result.latencyMs ? ` (${result.latencyMs}ms)` : "";
    output.push(`${emoji} ${result.keyName.padEnd(20)} | ${result.model.padEnd(20)} | ${result.status.padEnd(6)} ${latency}`);
    if (result.message) {
      output.push(`   └─ ${result.message}\n`);
    }
  }

  return output.join("\n");
}

// warehouse:method
// responsibility: Generates summary section with counts and configuration recommendations based on test results
// actor: report_formatter
// role: analyzer
// source_truth: implementation
function formatSummary(results) {
  const output = [];
  const ok = results.filter((r) => r.status === "OK");
  const quota = results.filter((r) => r.status === "QUOTA");
  const errors = results.filter((r) => r.status === "ERROR");

  output.push("═════════════════════════════════════════════════════════════════════════");
  output.push(`Summary: ${ok.length} OK, ${quota.length} QUOTA, ${errors.length} ERROR\n`);

  if (ok.length > 0) {
    output.push("✅ Recommended configuration:");
    const bestFlash = ok.find((r) => r.model === "gemini-2.5-flash");
    const bestPro = ok.find((r) => r.model === "gemini-2.5-pro");
    if (bestFlash) {
      output.push(`   Primary: ${bestFlash.keyName} with ${bestFlash.model}`);
    }
    if (bestPro) {
      output.push(`   Fallback: ${bestPro.keyName} with ${bestPro.model}`);
    }
  }

  if (quota.length > 0) {
    output.push("\n⚠️  Quota exhausted on:");
    quota.forEach((r) => output.push(`   - ${r.keyName} / ${r.model}`));
  }

  return output.join("\n");
}

// warehouse:method
// responsibility: Determines exit code from results (0 if any OK, 1 if only errors)
// actor: report_formatter
// role: status_calculator
// source_truth: implementation
function getExitCode(results) {
  const ok = results.filter((r) => r.status === "OK");
  const errors = results.filter((r) => r.status === "ERROR");
  return errors.length > 0 && ok.length === 0 ? 1 : 0;
}

module.exports = { formatReport, formatSummary, getExitCode };
