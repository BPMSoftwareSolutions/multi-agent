// warehouse:file
// responsibility: Validation utilities: normalizes strings to trimmed or null, converts to string arrays, normalizes approval/risk/recommendation status values
// actor: shared_infrastructure
// role: validation_utilities
// source_truth: implementation

// warehouse:method
// responsibility: Normalizes value to trimmed string or null, used for safe value comparison
// actor: shared_infrastructure
// role: validator
// source_truth: implementation
function toTrimmedString(value) {
  return typeof value === "string" ? value.trim() || null : null;
}

// warehouse:method
// responsibility: Normalizes value to array of trimmed strings, filtering empty entries for consistent handling
// actor: shared_infrastructure
// role: validator
// source_truth: implementation
function toStringArray(value) {
  if (!value) return [];
  if (!Array.isArray(value)) value = [value];
  return value.map((v) => (typeof v === "string" ? v.trim() : "")).filter((v) => v);
}

// warehouse:method
// responsibility: Validates and normalizes approval status to one of: approved, needs_review, rejected, pending
// actor: shared_infrastructure
// role: validator
// source_truth: implementation
function normalizeApprovalStatus(value) {
  const valid = new Set(["approved", "needs_review", "rejected", "pending"]);
  const normalized = String(value || "").toLowerCase().trim();
  return valid.has(normalized) ? normalized : "pending";
}

// warehouse:method
// responsibility: Validates and normalizes risk level to one of: low, medium, high with sensible defaults
// actor: shared_infrastructure
// role: validator
// source_truth: implementation
function normalizeRiskLevel(value) {
  const valid = new Set(["low", "medium", "high"]);
  const normalized = String(value || "").toLowerCase().trim();
  return valid.has(normalized) ? normalized : "medium";
}

// warehouse:method
// responsibility: Normalizes action recommendation input, validates required fields, assigns defaults, and ensures data consistency
// actor: shared_infrastructure
// role: validator
// source_truth: implementation
function normalizeActionRecommendation(input, context = {}) {
  if (!input) return null;

  const normalized = {
    id: toTrimmedString(input.id) || `rec-${Date.now()}`,
    action: toTrimmedString(input.action) || "unknown",
    targetPath: toTrimmedString(input.targetPath),
    targetType: toTrimmedString(input.targetType) || "file",
    priority: toTrimmedString(input.priority) || "medium",
    riskLevel: normalizeRiskLevel(input.riskLevel),
    approvalStatus: normalizeApprovalStatus(input.approvalStatus),
    assignee: toTrimmedString(input.assignee),
    description: toTrimmedString(input.description),
    tags: toStringArray(input.tags),
    metadata: input.metadata || {},
  };

  // Validate required fields
  if (!normalized.targetPath) {
    throw new Error("Action recommendation requires targetPath");
  }

  return normalized;
}

module.exports = {
  toTrimmedString,
  toStringArray,
  normalizeApprovalStatus,
  normalizeRiskLevel,
  normalizeActionRecommendation,
};
