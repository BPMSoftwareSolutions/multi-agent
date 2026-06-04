// warehouse:file
// responsibility: Evaluates file coherence by computing semantic similarity and detecting alignment issues
// actor: report_generator
// role: analyzer
// source_truth: implementation

const { computeSimilarity } = require("./similarity-scorer");
const { isBoilerplate, getAlignmentThreshold, detectRedFlags } = require("./boilerplate-classifier");

// warehouse:method
// responsibility: Evaluates single file coherence by analyzing method-to-file responsibility alignment
// actor: report_generator
// role: analyzer
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
// responsibility: Aggregates coherence analysis across all files and categorizes findings
// actor: report_generator
// role: aggregator
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

module.exports = { evaluateFileCoherence, aggregateAnalysis };
