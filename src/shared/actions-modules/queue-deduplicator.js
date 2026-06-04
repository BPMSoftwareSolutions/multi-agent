// warehouse:file
// responsibility: undefined — findDuplicateApprovedAction
// actor: method_implementation
// role: implementation
// source_truth: implementation

// warehouse:method
// responsibility: undefined — findDuplicateApprovedAction
// actor: method_implementation
// role: implementation
// source_truth: implementation
function findDuplicateApprovedAction(approvedActions, idempotencyKey) {
  return approvedActions.find(
    (action) => action.idempotencyKey === idempotencyKey
  ) || null;
}

// warehouse:method
// responsibility: undefined — findDuplicateReviewItem
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
