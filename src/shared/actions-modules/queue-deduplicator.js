// warehouse:file
// responsibility: Finds approved action by idempotencyKey, returns null if not found
// actor: method_implementation
// role: implementation
// source_truth: implementation

// warehouse:method
// responsibility: Finds approved action by idempotencyKey, returns null if not found
// actor: method_implementation
// role: implementation
// source_truth: implementation
function findDuplicateApprovedAction(approvedActions, idempotencyKey) {
  return approvedActions.find(
    (action) => action.idempotencyKey === idempotencyKey
  ) || null;
}

// warehouse:method
// responsibility: Finds review item by recommendationId, returns null if not found
// actor: method_implementation
// role: implementation
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
