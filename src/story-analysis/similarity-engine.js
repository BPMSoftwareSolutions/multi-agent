// warehouse:file
// responsibility: Computes semantic alignment scores and applies boilerplate classification with threshold rules
// actor: similarity_engine
// role: classifier
// source_truth: implementation

const { extractConcepts } = require("./concepts-extractor");

// warehouse:method
// responsibility: Computes semantic similarity between two responsibility texts using word overlap
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
// responsibility: Determines whether a method is boilerplate (parse args, format output, validate input) deserving lenient scoring
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
// responsibility: Adjusts alignment threshold based on whether method is boilerplate or core business logic
// actor: similarity_engine
// role: scorer
// source_truth: implementation
function getAlignmentThreshold(methodName) {
  return isBoilerplate(methodName) ? 30 : 50;
}

// warehouse:method
// responsibility: Detects red flags indicating method responsibility contradicts file responsibility
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
