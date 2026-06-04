// warehouse:file
// responsibility: Delegates action queueing to focused modules: orchestrates queue deduplication and action routing
// actor: action_orchestrator
// role: queue_manager
// source_truth: implementation

const { v4: uuidv4 } = require("uuid");
const { normalizeActionRecommendation } = require("../validation-helpers");
const { registerFile } = require("./item-registrar");
const { ensureOperationsState } = require("./operations-builder");

// warehouse:method
// responsibility: Routes queued human review item to operations queue with deduplication check
// actor: method_implementation
// role: implementation
// source_truth: implementation
function queueHumanReviewItem(operations, recommendation, context = {}) {
  const existing = operations.humanReviewQueue.find(
    (item) => item.recommendationId === recommendation.recommendationId
  );
  if (existing) {
    return existing;
  }

  const queueItem = {
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

  operations.humanReviewQueue.push(queueItem);
  return queueItem;
}

// warehouse:method
// responsibility: Routes action recommendations through normalization, routing logic, and approval workflow with deduplication
// actor: method_implementation
// role: implementation
// source_truth: implementation
function queueActionRecommendations(session, recommendations, context = {}) {
  const operations = ensureOperationsState(session);
  const summary = {
    enqueued: 0,
    duplicates: 0,
    humanReview: 0,
    rejected: 0,
    invalid: 0,
    actionIds: []
  };

  const normalizedRecommendations = Array.isArray(recommendations) ? recommendations : [];
  normalizedRecommendations.forEach((recommendationInput) => {
    const recommendation = normalizeActionRecommendation(recommendationInput, {
      ...context,
      sessionId: session.id
    });

    if (!recommendation) {
      summary.invalid += 1;
      return;
    }

    registerFile(operations, recommendation);

    if (recommendation.approvalStatus === "rejected") {
      summary.rejected += 1;
      return;
    }

    if (recommendation.approvalStatus === "needs_human_review") {
      queueHumanReviewItem(operations, recommendation, context);
      summary.humanReview += 1;
      return;
    }

    const existing = operations.approvedActions.find(
      (action) => action.idempotencyKey === recommendation.idempotencyKey
    );

    if (existing) {
      summary.duplicates += 1;
      summary.actionIds.push(existing.actionId);
      return;
    }

    const now = new Date().toISOString();
    const action = {
      actionId: `act_${uuidv4()}`,
      recommendationId: recommendation.recommendationId,
      itemId: recommendation.itemId,
      sessionId: session.id,
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

    operations.approvedActions.push(action);
    summary.enqueued += 1;
    summary.actionIds.push(action.actionId);
  });

  return summary;
}

// warehouse:method
// responsibility: Wraps manual recommendation for queueing to enable CLI-driven action approval workflow
// actor: method_implementation
// role: implementation
// source_truth: implementation
function approveManualAction(session, recommendationInput, context = {}) {
  return queueActionRecommendations(session, [recommendationInput], context);
}

module.exports = {
  queueActionRecommendations,
  queueHumanReviewItem,
  approveManualAction
};
