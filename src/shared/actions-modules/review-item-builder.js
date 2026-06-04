// warehouse:file
// responsibility: Constructs human review queue items from recommendations
// actor: action_orchestrator
// role: review_builder
// source_truth: implementation

const { v4: uuidv4 } = require("uuid");

// warehouse:method
// responsibility: Creates human review queue item from recommendation
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildReviewItem(recommendation, context = {}) {
  return {
    reviewId: `review_${uuidv4()}`,
    recommendationId: recommendation.recommendationId,
    itemId: recommendation.itemId,
    fileId: recommendation.fileId,
    reason:
      recommendation.rationale ||
      `Recommendation ${recommendation.recommendationId} requires human review.`,
    riskLevel: recommendation.riskLevel,
    blockedActionId: null,
    stageId: context.stageId || null,
    roundNumber: context.roundNumber || null,
    createdAt: new Date().toISOString()
  };
}

module.exports = { buildReviewItem };
