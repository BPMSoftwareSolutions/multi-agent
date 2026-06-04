// warehouse:file
// responsibility: Delegates action queueing to focused modules: orchestrates queue deduplication and action routing
// actor: action_orchestrator
// role: queue_manager
// source_truth: implementation

const { normalizeActionRecommendation } = require("../validation-helpers");
const { registerFile } = require("./item-registrar");
const { ensureOperationsState } = require("./operations-builder");
const { findDuplicateApprovedAction, findDuplicateReviewItem } = require("./queue-deduplicator");
const { buildApprovedAction, buildReviewItem } = require("./action-builder");

// warehouse:method
// responsibility: Routes queued human review item to operations queue with deduplication check
// actor: method_implementation
// role: implementation
// source_truth: implementation
function queueHumanReviewItem(operations, recommendation, context = {}) {
  const existing = findDuplicateReviewItem(operations.humanReviewQueue, recommendation.recommendationId);
  if (existing) {
    return existing;
  }

  const queueItem = buildReviewItem(recommendation, context);
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

    const existing = findDuplicateApprovedAction(operations.approvedActions, recommendation.idempotencyKey);
    if (existing) {
      summary.duplicates += 1;
      summary.actionIds.push(existing.actionId);
      return;
    }

    const action = buildApprovedAction(recommendation, session.id, operations, context);
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
