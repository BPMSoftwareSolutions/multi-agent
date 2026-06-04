// warehouse:file
// responsibility: Determines alignment threshold percentage based on method boilerplate classification
// actor: coherence_analyzer
// role: threshold_calculator
// source_truth: implementation

const { isBoilerplate } = require("./boilerplate-classifier");

// warehouse:method
// responsibility: Determines alignment threshold percentage (30 for boilerplate, 50 for domain-specific) based on method boilerplate classification
// actor: method_implementation
// role: implementation
// source_truth: implementation
function getAlignmentThreshold(methodName) {
  return isBoilerplate(methodName) ? 30 : 50;
}

module.exports = { getAlignmentThreshold };
