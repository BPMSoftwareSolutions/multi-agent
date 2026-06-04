// warehouse:file
// responsibility: Routes review item to queue with deduplication by recommendationId
// actor: action_orchestrator
// role: review_queue_manager
// source_truth: implementation

const { buildReviewItem } = require("./review-item-builder");
const { ensureOperationsState } = require("./operations-state-validator");

// warehouse:method
// responsibility: Routes review item to queue with deduplication by recommendationId
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

  const queueItem = buildReviewItem(recommendation, context);
  operations.humanReviewQueue.push(queueItem);
  return queueItem;
}

module.exports = { queueHumanReviewItem };
