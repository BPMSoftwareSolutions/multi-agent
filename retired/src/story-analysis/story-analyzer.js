// warehouse:file
// responsibility: Loads taxonomy data and evaluates coherence for all files and Computes overall health metrics from coherence analysis
// actor: story_analyzer
// role: analyzer
// source_truth: implementation

const path = require("path");
const fs = require("fs");
const { evaluateFileCoherence } = require("./coherence-evaluator");

// warehouse:method
// responsibility: Loads taxonomy data and evaluates coherence for all files and Computes overall health metrics from coherence analysis
// actor: method_implementation
// role: implementation
// source_truth: implementation
function analyzeAllFiles(taxonomyPath) {
  if (!fs.existsSync(taxonomyPath)) {
    console.error(`❌ Error: ${taxonomyPath} not found`);
    console.error("Run: node bin/extract-taxonomy.js");
    process.exit(1);
  }

  const taxonomyData = JSON.parse(fs.readFileSync(taxonomyPath, "utf8"));
  const analyses = [];

  for (const file of taxonomyData.files) {
    analyses.push({
      path: file.path,
      analysis: evaluateFileCoherence(file),
    });
  }

  analyses.sort((a, b) => a.analysis.coherenceScore - b.analysis.coherenceScore);
  return analyses;
}

// warehouse:method
// responsibility: Loads taxonomy data and evaluates coherence for all files and Computes overall health metrics from coherence analysis
// actor: method_implementation
// role: implementation
// source_truth: implementation
function computeHealthMetrics(analyses) {
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

module.exports = { analyzeAllFiles, computeHealthMetrics };
