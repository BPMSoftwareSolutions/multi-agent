// warehouse:file
// responsibility: Coordinates normalizeApprovalStatus and normalizeRiskLevel behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation

// warehouse:method
// responsibility: Coordinates normalizeApprovalStatus and normalizeRiskLevel behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function normalizeApprovalStatus(value) {
  const valid = new Set(["approved", "needs_review", "rejected", "pending"]);
  const normalized = String(value || "").toLowerCase().trim();
  return valid.has(normalized) ? normalized : "pending";
}

// warehouse:method
// responsibility: Coordinates normalizeApprovalStatus and normalizeRiskLevel behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function normalizeRiskLevel(value) {
  const valid = new Set(["low", "medium", "high"]);
  const normalized = String(value || "").toLowerCase().trim();
  return valid.has(normalized) ? normalized : "medium";
}

module.exports = { normalizeApprovalStatus, normalizeRiskLevel };
