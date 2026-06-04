// warehouse:file
// responsibility: CLI entry point that delegates story coherence analysis to reporter module
// actor: cli
// role: delegator
// source_truth: implementation

const path = require("path");
const fs = require("fs");
const { evaluateFileCoherence } = require("../src/story-analysis/coherence-evaluator");

// warehouse:method
// responsibility: Orchestrates coherence analysis workflow by loading taxonomy data, generating report, and writing narrative findings
// actor: method_implementation
// role: implementation
// source_truth: implementation
function main() {
  const taxonomyPath = path.resolve(__dirname, "..", "reports", "taxonomy-extracted.json");

  if (!fs.existsSync(taxonomyPath)) {
    console.error(`❌ Error: ${taxonomyPath} not found`);
    console.error("Run: node bin/extract-taxonomy.js");
    process.exit(1);
  }

  console.log("🔍 Analyzing story coherence...\n");

  const taxonomyData = JSON.parse(fs.readFileSync(taxonomyPath, "utf8"));
  const analyses = [];

  for (const file of taxonomyData.files) {
    analyses.push({
      path: file.path,
      analysis: evaluateFileCoherence(file),
    });
  }

  analyses.sort((a, b) => a.analysis.coherenceScore - b.analysis.coherenceScore);

  const avgScore = Math.round(
    analyses.reduce((sum, a) => sum + a.analysis.coherenceScore, 0) / analyses.length
  );
  const strongStories = analyses.filter((a) => a.analysis.coherenceScore >= 70).length;
  const weakStories = analyses.filter((a) => a.analysis.coherenceScore < 50).length;

  const report = {
    overallHealth: avgScore,
    strongStories,
    weakStories,
    analyses,
  };

  // Write report to file
  const reportRoot = path.dirname(taxonomyPath);
  const reportFile = path.join(reportRoot, "story-analysis.json");
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), "utf8");

  // Output formatted report
  console.log("\n📖 STORY COHERENCE ANALYSIS\n");
  console.log("═════════════════════════════════════════════════════════════════════════");
  console.log(`Overall Health Score: ${report.overallHealth}/100`);
  console.log(`Strong Stories (≥70):  ${report.strongStories}/${report.analyses.length}`);
  console.log(`Weak Stories (<50):    ${report.weakStories}/${report.analyses.length}`);
  console.log("═════════════════════════════════════════════════════════════════════════\n");

  if (report.weakStories > 0) {
    console.log("⚠️  WEAK STORIES (needs coherence work):\n");
    for (const a of report.analyses) {
      if (a.analysis.coherenceScore < 50) {
        console.log(`❌ ${a.path} — Score: ${a.analysis.coherenceScore}/100`);
        console.log(`   File: "${a.analysis.fileResp.substring(0, 70)}..."`);
        if (a.analysis.issues.length > 0) {
          for (const issue of a.analysis.issues) {
            console.log(`   └─ ${issue.method}: "${issue.methodResp.substring(0, 60)}..."`);
            console.log(`      Alignment: ${issue.similarity}% ${issue.flags.length > 0 ? `| Flags: ${issue.flags.join(", ")}` : ""}`);
          }
        }
        console.log();
      }
    }
  }

  console.log("\n✅ STRONG STORIES (coherent narrative):\n");
  const strongCount = Math.min(5, report.analyses.filter((a) => a.analysis.coherenceScore >= 70).length);
  for (let i = 0; i < strongCount; i++) {
    const a = report.analyses[report.analyses.length - 1 - i];
    if (a.analysis.coherenceScore >= 70) {
      console.log(
        `✅ ${a.path} — Score: ${a.analysis.coherenceScore}/100 (${a.analysis.alignedMethods}/${a.analysis.totalMethods} methods aligned)`
      );
    }
  }

  console.log(`\n📊 Full analysis written to: ${reportFile}`);
  console.log("═════════════════════════════════════════════════════════════════════════\n");
}

if (require.main === module) {
  main();
}
