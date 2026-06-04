// warehouse:file
// responsibility: Generates formatted coherence analysis report from aggregated findings with summary and breakdown
// actor: method_implementation
// role: implementation
// source_truth: implementation

// warehouse:method
// responsibility: Generates formatted coherence analysis report from aggregated findings with summary and breakdown
// actor: method_implementation
// role: implementation
// source_truth: implementation
function generateCoherenceReport(aggregatedAnalysis) {
  const report = {
    summary: {
      overallCoherence: aggregatedAnalysis.overallHealth,
      totalFiles: aggregatedAnalysis.analyses.length,
      filesWithHighCoherence: aggregatedAnalysis.strongStories,
      filesWithLowCoherence: aggregatedAnalysis.weakStories,
      averageCoherence: aggregatedAnalysis.overallHealth,
    },
    breakdown: aggregatedAnalysis.analyses.map((item) => ({
      path: item.path,
      coherenceScore: item.analysis.coherenceScore,
      alignedMethods: item.analysis.alignedMethods,
      totalMethods: item.analysis.totalMethods,
      issues: item.analysis.issues,
    })),
    timestamp: new Date().toISOString(),
  };

  return report;
}

module.exports = { generateCoherenceReport };
