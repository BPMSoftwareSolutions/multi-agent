// warehouse:file
// responsibility: Validation utilities aggregator - delegates to focused validation modules
// actor: shared_infrastructure
// role: entry_point
// source_truth: implementation

const { toTrimmedString, toStringArray } = require("./validation-modules/string-normalizer");
const { normalizeApprovalStatus, normalizeRiskLevel } = require("./validation-modules/status-validator");
const { normalizeActionRecommendation } = require("./validation-modules/recommendation-validator");

module.exports = {
  toTrimmedString,
  toStringArray,
  normalizeApprovalStatus,
  normalizeRiskLevel,
  normalizeActionRecommendation,
};
