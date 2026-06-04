// warehouse:file
// responsibility: Constructs approved action objects from normalized recommendations
// actor: action_orchestrator
// role: action_builder
// source_truth: implementation

const { v4: uuidv4 } = require("uuid");

// warehouse:method
// responsibility: Creates action object from recommendation with tracking metadata
// actor: method_implementation
// role: implementation
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

module.exports = { buildApprovedAction };
