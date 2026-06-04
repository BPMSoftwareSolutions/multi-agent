// warehouse:file
// responsibility: Classifies methods as boilerplate based on infrastructure naming patterns
// actor: coherence_analyzer
// role: boilerplate_classifier
// source_truth: implementation

// warehouse:method
// responsibility: Classifies method as boilerplate by pattern matching against infrastructure naming conventions
// actor: method_implementation
// role: implementation
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

module.exports = { isBoilerplate };
