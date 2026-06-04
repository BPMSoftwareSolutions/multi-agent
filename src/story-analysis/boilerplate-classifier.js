// warehouse:file
// responsibility: undefined — isBoilerplate
// actor: method_implementation
// role: implementation
// source_truth: implementation

// warehouse:method
// responsibility: undefined — isBoilerplate
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

// warehouse:method
// responsibility: Determines alignment threshold percentage based on method boilerplate classification
// actor: method_implementation
// role: implementation
// source_truth: implementation
function getAlignmentThreshold(methodName) {
  return isBoilerplate(methodName) ? 30 : 50;
}

// warehouse:method
// responsibility: Detects alignment red flags in responsibility text (generic, maintenance, error-only, vague)
// actor: method_implementation
// role: implementation
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
  isBoilerplate,
  getAlignmentThreshold,
  detectRedFlags,
};
