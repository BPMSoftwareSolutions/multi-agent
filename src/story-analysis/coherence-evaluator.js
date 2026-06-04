// warehouse:file
// responsibility: Evaluates file coherence across entire taxonomy, aggregates findings, generates and writes narrative analysis reports
// actor: report_generator
// role: orchestrator
// source_truth: implementation

const fs = require("fs");
const path = require("path");
const { computeSimilarity, isBoilerplate, getAlignmentThreshold, detectRedFlags } = require("./similarity-engine");

// warehouse:method
// responsibility: Evaluates file coherence by computing semantic similarity between file responsibility and method responsibilities, applying weighted alignment thresholds and detecting misalignment issues
// actor: report_generator
// role: scorer
// source_truth: implementation
function evaluateFileCoherence(file) {
  if (file.methods.length === 0) {
    return {
      fileResp: file.file.responsibility,
      coherenceScore: 100,
      alignedMethods: 0,
      totalMethods: 0,
      analysisNote: "no_methods_to_validate",
      issues: [],
    };
  }

  const fileResp = file.file.responsibility;
  let totalSimilarity = 0;
  let alignedMethods = 0;
  const issues = [];

  for (const method of file.methods) {
    const similarity = computeSimilarity(fileResp, method.taxonomy.responsibility);
    const flags = detectRedFlags(fileResp, method.taxonomy.responsibility);
    const threshold = getAlignmentThreshold(method.name);

    if (similarity >= threshold) {
      alignedMethods++;
    } else {
      issues.push({
        method: method.name,
        methodResp: method.taxonomy.responsibility,
        similarity: Math.round(similarity),
        threshold,
        flags,
        isBoilerplate: isBoilerplate(method.name),
      });
    }

    totalSimilarity += similarity;
  }

  const coherenceScore = Math.round(totalSimilarity / file.methods.length);

  return {
    fileResp,
    coherenceScore,
    alignedMethods,
    totalMethods: file.methods.length,
    issues,
  };
}

// warehouse:method
// responsibility: Generates human-readable narrative coherence analysis by evaluating all files, aggregating coherence scores, and categorizing strong vs weak story findings
// actor: report_generator
// role: orchestrator
// source_truth: implementation
function generateReport(taxonomyData) {
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

  return {
    overallHealth: avgScore,
    strongStories,
    weakStories,
    analyses,
  };
}

// warehouse:method
// responsibility: Formats and writes coherence narrative findings to console output and JSON report file, rendering analysis metrics and weak story diagnostics
// actor: report_generator
// role: formatter
// source_truth: implementation
function writeReport(report, taxonomyPath) {
  const reportRoot = path.dirname(taxonomyPath);
  const reportFile = path.join(reportRoot, "story-analysis.json");

  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), "utf8");

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

// warehouse:method
// responsibility: Orchestrates coherence analysis workflow by loading taxonomy data, generating aggregated coherence report, and writing narrative analysis findings
// actor: report_generator
// role: orchestrator
// source_truth: implementation
function main() {
  const taxonomyPath = path.resolve(__dirname, "..", "..", "reports", "taxonomy-extracted.json");

  if (!fs.existsSync(taxonomyPath)) {
    console.error(`❌ Error: ${taxonomyPath} not found`);
    console.error("Run: node bin/extract-taxonomy.js");
    process.exit(1);
  }

  console.log("🔍 Analyzing story coherence...\n");

  const taxonomyData = JSON.parse(fs.readFileSync(taxonomyPath, "utf8"));
  const report = generateReport(taxonomyData);

  writeReport(report, taxonomyPath);
}

module.exports = { evaluateFileCoherence, generateReport, writeReport, main };

if (require.main === module) {
  main();
}
