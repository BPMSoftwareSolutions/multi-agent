// warehouse:file
// responsibility: Evaluates single file coherence by analyzing method-to-file responsibility alignment
// actor: coherence_analyzer
// role: file_analyzer
// source_truth: implementation

const { computeSimilarity } = require("./similarity-scorer");
const { detectRedFlags } = require("./red-flag-detector");
const { getAlignmentThreshold } = require("./threshold-calculator");
const { isBoilerplate } = require("./boilerplate-classifier");

// warehouse:method
// responsibility: Evaluates single file coherence by analyzing method-to-file responsibility alignment
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
