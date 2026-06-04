// warehouse:file
// responsibility: Routes approved recommendations into action queue with deduplication
// actor: action_orchestrator
// role: queue_manager
// source_truth: implementation

const { v4: uuidv4 } = require("uuid");
const { normalizeActionRecommendation } = require("../validation-helpers");
const { registerFile } = require("./file-registrar");
const { ensureOperationsState } = require("./operations-state-validator");
const { buildApprovedAction } = require("./approved-action-builder");

// warehouse:method
// responsibility: Routes approved recommendations through normalization and adds to action queue
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

    const action = buildApprovedAction(recommendation, session.id, operations, context);
    operations.approvedActions.push(action);
    summary.enqueued += 1;
    summary.actionIds.push(action.actionId);
  });

  return summary;
}

// warehouse:method
// responsibility: Wraps manual recommendation for CLI-driven approval workflow
// actor: method_implementation
// role: implementation
// source_truth: implementation
function approveManualAction(session, recommendationInput, context = {}) {
  return queueActionRecommendations(session, [recommendationInput], context);
}

module.exports = {
  queueActionRecommendations,
  approveManualAction
};
