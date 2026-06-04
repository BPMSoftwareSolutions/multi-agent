// warehouse:file
// responsibility: Detects alignment red flags in responsibility text
// actor: coherence_analyzer
// role: red_flag_detector
// source_truth: implementation

// warehouse:method
// responsibility: Detects alignment red flags by analyzing responsibility text for generic terminology, maintenance tasks, error-only handling, and vagueness indicators
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

module.exports = { detectRedFlags };
