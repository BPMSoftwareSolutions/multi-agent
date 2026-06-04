// warehouse:file
// responsibility: Aggregates coherence analysis across all files and categorizes findings
// actor: coherence_analyzer
// role: aggregator
// source_truth: implementation

const { evaluateFileCoherence } = require("./coherence-analyzer");

// warehouse:method
// responsibility: Aggregates coherence analysis across all files and categorizes overall health findings
// actor: method_implementation
// role: implementation
// source_truth: implementation
function aggregateAnalysis(taxonomyData) {
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

module.exports = { aggregateAnalysis };
