// warehouse:file
// responsibility: Constructs action objects from normalized recommendations for approved action queue
// actor: shared
// role: action_builder
// source_truth: implementation

const { v4: uuidv4 } = require("uuid");

// warehouse:method
// responsibility: Builds approved action object from normalized recommendation with metadata and tracking state
// actor: shared
// role: action_builder
// source_truth: implementation
function buildApprovedAction(recommendation, sessionId, operations, context = {}) {
  const now = new Date().toISOString();
  return {
    actionId: `act_${uuidv4()}`,
    recommendationId: recommendation.recommendationId,
    itemId: recommendation.itemId,
    sessionId,
    stageId: context.stageId || null,
    roundNumber: context.roundNumber || null,
    fileId: recommendation.fileId,
    provider: recommendation.provider || (operations.files[recommendation.fileId]?.provider || null),
    approvedAction: recommendation.actionType,
    actionType: recommendation.actionType,
    targetParentId: recommendation.targetParentId,
    newName: recommendation.newName,
    tags: recommendation.tags,
    approvalStatus: recommendation.approvalStatus,
    approvedBy: recommendation.approvedBy,
    rationale: recommendation.rationale,
    riskLevel: recommendation.riskLevel,
    status: "pending",
    idempotencyKey: recommendation.idempotencyKey,
    expectedState: {
      parentId: recommendation.currentParentId,
      name: recommendation.currentName,
      revision: recommendation.expectedRevision
    },
    approvedAt: now,
    updatedAt: now,
    lastError: null,
    result: null
  };
}

// warehouse:method
// responsibility: Builds human review queue item from recommendation with review tracking metadata
// actor: shared
// role: action_builder
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

module.exports = {
  buildApprovedAction,
  buildReviewItem
};
