// warehouse:file
// responsibility: Validates and normalizes action recommendation objects
// actor: shared_infrastructure
// role: validator
// source_truth: implementation

const { toTrimmedString, toStringArray } = require("./string-normalizer");
const { normalizeApprovalStatus, normalizeRiskLevel } = require("./status-validator");

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

  if (!normalized.targetPath) {
    throw new Error("Action recommendation requires targetPath");
  }

  return normalized;
}

module.exports = { normalizeActionRecommendation };
