// warehouse:file
// responsibility: Computes semantic alignment scores and applies boilerplate classification with threshold rules
// actor: similarity_engine
// role: classifier
// source_truth: implementation

const { extractConcepts } = require("./concepts-extractor");

// warehouse:method
// responsibility: Computes semantic alignment scores by extracting concept vocabularies, computing word overlap ratios, and normalizing alignment percentages for file-method coherence validation
// actor: similarity_engine
// role: comparator
// source_truth: implementation
function computeSimilarity(fileResp, methodResp) {
  const fileConcepts = extractConcepts(fileResp);
  const methodConcepts = extractConcepts(methodResp);

  const overlap = fileConcepts.words.filter((w) => methodConcepts.words.includes(w)).length;
  const maxLength = Math.max(fileConcepts.words.length, methodConcepts.words.length);

  return maxLength > 0 ? (overlap / maxLength) * 100 : 0;
}

// warehouse:method
// responsibility: Classifies method boilerplate status by pattern matching against infrastructure naming conventions (parse, render, validate, init, main) for alignment threshold determination
// actor: similarity_engine
// role: classifier
// source_truth: implementation
function isBoilerplate(methodName) {
  const boilerplatePatterns = [
    /parse[_a-z]*(arg|option|flag|param)/i,
    /render|format|display|output|print|log/i,
    /validate|check|ensure|verify/i,
    /init|setup|configure/i,
    /main|run|execute/i,
  ];
  return boilerplatePatterns.some((pattern) => pattern.test(methodName));
}

// warehouse:method
// responsibility: Determines alignment threshold percentage (30 for boilerplate, 50 for domain-specific) based on method boilerplate classification
// actor: similarity_engine
// role: scorer
// source_truth: implementation
function getAlignmentThreshold(methodName) {
  return isBoilerplate(methodName) ? 30 : 50;
}

// warehouse:method
// responsibility: Detects alignment red flags by analyzing responsibility text for generic terminology, maintenance tasks, error-only handling, and vagueness indicators
// actor: contradiction_detector
// role: validator
// source_truth: implementation
function detectRedFlags(fileResp, methodResp) {
  const flags = [];
  const methodLower = methodResp.toLowerCase();

  if (methodLower.match(/^(helper|utility|internal|function|method|process|handle)/i)) {
    flags.push("generic_responsibility");
  }

  if (methodLower.match(/(cleanup|reset|clear|remove|delete|deprecat)/i)) {
    flags.push("maintenance_task");
  }

  if (methodLower.match(/^(catch|handle|recover from)/i)) {
    flags.push("error_only");
  }

  if (methodLower.split(/\s+/).length < 3) {
    flags.push("too_vague");
  }

  return flags;
}

module.exports = {
  computeSimilarity,
  isBoilerplate,
  getAlignmentThreshold,
  detectRedFlags,
};
