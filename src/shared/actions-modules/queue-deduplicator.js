// warehouse:file
// responsibility: undefined
// actor: undefined
// role: undefined
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
