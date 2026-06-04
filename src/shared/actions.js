// warehouse:file
// responsibility: Delegator exporting all action system operations: state management, registration, queuing, and execution
// actor: shared
// role: delegator
// source_truth: implementation

const { normalizeActionRecommendation } = require("./validation-helpers");
const { buildOperationsState, ensureOperationsState } = require("./actions-modules/operations-builder");
const { registerFolder, registerFile } = require("./actions-modules/item-registrar");
const {
  queueActionRecommendations,
  queueHumanReviewItem,
  approveManualAction
} = require("./actions-modules/action-queuer");
const {
  runWorker,
  failAttempt,
  summarizeOperations
} = require("./actions-modules/action-executor");

const ACTION_TYPES = new Set([
  "rename",
  "move",
  "add_tag",
  "mark_duplicate",
  "archive_candidate"
]);

const APPROVAL_STATUSES = new Set(["approved", "needs_human_review", "rejected"]);

module.exports = {
  ACTION_TYPES,
  APPROVAL_STATUSES,
  buildOperationsState,
  ensureOperationsState,
  registerFolder,
  registerFile,
  normalizeActionRecommendation,
  approveManualAction,
  queueActionRecommendations,
  queueHumanReviewItem,
  runWorker,
  failAttempt,
  summarizeOperations
};