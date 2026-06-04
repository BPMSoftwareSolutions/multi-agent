// warehouse:file
// responsibility: Formats and persists coherence analysis results with detailed narrative output
// actor: analysis_formatter
// role: output_writer
// source_truth: implementation

const path = require("path");
const fs = require("fs");

// warehouse:method
// responsibility: Persists analysis report to JSON file
// actor: method_implementation
// role: implementation
// source_truth: implementation
function writeAnalysisReport(report, taxonomyPath) {
  const reportRoot = path.dirname(taxonomyPath);
  const reportFile = path.join(reportRoot, "story-analysis.json");
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), "utf8");
  return reportFile;
}

// warehouse:method
// responsibility: Renders weak stories section with detailed issue analysis and alignment metrics
// actor: method_implementation
// role: implementation
// source_truth: implementation
function displayWeakStories(analyses) {
  console.log("⚠️  WEAK STORIES (needs coherence work):\n");
  for (const a of analyses) {
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

// warehouse:method
// responsibility: Renders strong stories section showing coherent narratives with alignment metrics
// actor: method_implementation
// role: implementation
// source_truth: implementation
function displayStrongStories(analyses) {
  console.log("\n✅ STRONG STORIES (coherent narrative):\n");
  const strongCount = Math.min(5, analyses.filter((a) => a.analysis.coherenceScore >= 70).length);
  for (let i = 0; i < strongCount; i++) {
    const a = analyses[analyses.length - 1 - i];
    if (a.analysis.coherenceScore >= 70) {
      console.log(
        `✅ ${a.path} — Score: ${a.analysis.coherenceScore}/100 (${a.analysis.alignedMethods}/${a.analysis.totalMethods} methods aligned)`
      );
    }
  }
}

// warehouse:method
// responsibility: Renders comprehensive coherence analysis with header, metrics, weak/strong stories
// actor: method_implementation
// role: implementation
// source_truth: implementation
function displayAnalysisReport(report, reportFile) {
  console.log("\n📖 STORY COHERENCE ANALYSIS\n");
  console.log("═════════════════════════════════════════════════════════════════════════");
  console.log(`Overall Health Score: ${report.overallHealth}/100`);
  console.log(`Strong Stories (≥70):  ${report.strongStories}/${report.analyses.length}`);
  console.log(`Weak Stories (<50):    ${report.weakStories}/${report.analyses.length}`);
  console.log("═════════════════════════════════════════════════════════════════════════\n");

  if (report.weakStories > 0) {
    displayWeakStories(report.analyses);
  }

  displayStrongStories(report.analyses);

  console.log(`\n📊 Full analysis written to: ${reportFile}`);
  console.log("═════════════════════════════════════════════════════════════════════════\n");
}

module.exports = { writeAnalysisReport, displayAnalysisReport };
