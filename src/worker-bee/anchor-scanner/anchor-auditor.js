// warehouse:file
// responsibility: Assesses anchor completeness by validating all fields, checking vocabulary constraints, and detecting consistency issues
// actor: worker_bee_infrastructure
// role: validator
// source_truth: implementation

const { FILE_ANCHOR_FIELD_ORDER, ROLE_VOCAB, SOURCE_TRUTH_VOCAB, MUTATION_POLICY_VOCAB } = require("../anchor-spec");
const { isPlaceholder, isGenericResponsibility, normPath } = require("../text-utils");

// warehouse:method
// responsibility: Assesses anchor completeness by validating all fields, checking vocabulary constraints, and detecting consistency issues
// actor: method_implementation
// role: implementation
// source_truth: implementation
function assessAnchor(fields, deterministic) {
  const issues = [];
  for (const key of FILE_ANCHOR_FIELD_ORDER) {
    if (isPlaceholder(fields[key])) issues.push(`${key}:missing_or_placeholder`);
  }
  if (fields.role && !ROLE_VOCAB.includes(fields.role)) issues.push("role:not_in_vocab");
  if (fields.source_truth && !SOURCE_TRUTH_VOCAB.includes(fields.source_truth)) issues.push("source_truth:not_in_vocab");
  if (fields.mutation_policy && !MUTATION_POLICY_VOCAB.includes(fields.mutation_policy)) issues.push("mutation_policy:not_in_vocab");
  if (fields.generated && !["true", "false"].includes(String(fields.generated).toLowerCase())) issues.push("generated:not_bool");
  if (fields.actor && /[A-Z ]/.test(fields.actor)) issues.push("actor:not_snake_case");
  if (isGenericResponsibility(fields.responsibility)) issues.push("responsibility:generic");
  if (fields.expected_location && normPath(fields.expected_location) !== normPath(deterministic.expected_location)) issues.push("expected_location:mismatch");
  if (String(fields.repo_root_depth) !== String(deterministic.repo_root_depth)) issues.push("repo_root_depth:mismatch");
  return issues;
}

module.exports = { assessAnchor };
