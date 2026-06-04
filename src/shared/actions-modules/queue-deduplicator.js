// warehouse:file
// responsibility: Checks if approved action already exists by idempotency key, returns existing action or null
// actor: shared
// role: queue_deduplicator
// source_truth: implementation

// warehouse:method
// responsibility: undefined
// actor: undefined
// role: undefined
// source_truth: implementation

function findDuplicateApprovedAction(approvedActions, idempotencyKey) {
  return approvedActions.find(
    (action) => action.idempotencyKey === idempotencyKey
  ) || null;
}

// warehouse:method
// responsibility: undefined
// actor: undefined
// role: undefined
// source_truth: implementation

function findDuplicateReviewItem(humanReviewQueue, recommendationId) {
  return humanReviewQueue.find(
    (item) => item.recommendationId === recommendationId
  ) || null;
}

module.exports = {
  findDuplicateApprovedAction,
  findDuplicateReviewItem
};
