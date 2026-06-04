// warehouse:file
// responsibility: Validates and normalizes status values (approval, risk level)
// actor: shared_infrastructure
// role: validator
// source_truth: implementation

function normalizeApprovalStatus(value) {
  const valid = new Set(["approved", "needs_review", "rejected", "pending"]);
  const normalized = String(value || "").toLowerCase().trim();
  return valid.has(normalized) ? normalized : "pending";
}

function normalizeRiskLevel(value) {
  const valid = new Set(["low", "medium", "high"]);
  const normalized = String(value || "").toLowerCase().trim();
  return valid.has(normalized) ? normalized : "medium";
}

module.exports = { normalizeApprovalStatus, normalizeRiskLevel };
