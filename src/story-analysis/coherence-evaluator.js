// warehouse:file
// responsibility: Evaluates file coherence by computing semantic similarity between file and method responsibilities
// actor: coherence_analyzer
// role: analyzer
// source_truth: implementation

const { computeSimilarity, isBoilerplate, getAlignmentThreshold, detectRedFlags } = require("./similarity-engine");

// warehouse:method
// responsibility: Evaluates file coherence by computing semantic similarity between file responsibility and method responsibilities, applying weighted alignment thresholds and detecting misalignment issues
// actor: method_implementation
// role: implementation
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

module.exports = { evaluateFileCoherence };
