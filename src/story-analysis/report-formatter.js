// warehouse:file
// responsibility: Formats coherence analysis into colored console output with weak/strong file scores and method alignment details
// actor: method_implementation
// role: implementation
// source_truth: implementation

// warehouse:method
// responsibility: Formats coherence analysis into colored console output with weak/strong file scores and method alignment details
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatReport(report) {
  const output = [];
  output.push("\n📖 STORY COHERENCE ANALYSIS\n");
  output.push("═════════════════════════════════════════════════════════════════════════");
  output.push(`Overall Health Score: ${report.overallHealth}/100`);
  output.push(`Strong Stories (≥70):  ${report.strongStories}/${report.analyses.length}`);
  output.push(`Weak Stories (<50):    ${report.weakStories}/${report.analyses.length}`);
  output.push("═════════════════════════════════════════════════════════════════════════\n");

  if (report.weakStories > 0) {
    output.push("⚠️  WEAK STORIES (needs coherence work):\n");
    for (const a of report.analyses) {
      if (a.analysis.coherenceScore < 50) {
        output.push(`❌ ${a.path} — Score: ${a.analysis.coherenceScore}/100`);
        output.push(`   File: "${a.analysis.fileResp.substring(0, 70)}..."`);
        if (a.analysis.issues.length > 0) {
          for (const issue of a.analysis.issues) {
            output.push(`   └─ ${issue.method}: "${issue.methodResp.substring(0, 60)}..."`);
            output.push(`      Alignment: ${issue.similarity}% ${issue.flags.length > 0 ? `| Flags: ${issue.flags.join(", ")}` : ""}`);
          }
        }
        output.push("");
      }
    }
  }

  output.push("\n✅ STRONG STORIES (coherent narrative):\n");
  const strongCount = Math.min(5, report.analyses.filter((a) => a.analysis.coherenceScore >= 70).length);
  for (let i = 0; i < strongCount; i++) {
    const a = report.analyses[report.analyses.length - 1 - i];
    if (a.analysis.coherenceScore >= 70) {
      output.push(
        `✅ ${a.path} — Score: ${a.analysis.coherenceScore}/100 (${a.analysis.alignedMethods}/${a.analysis.totalMethods} methods aligned)`
      );
    }
  }

  return output.join("\n");
}

module.exports = { formatReport };
