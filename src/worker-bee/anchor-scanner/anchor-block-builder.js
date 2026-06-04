// warehouse:file
// responsibility: Constructs formatted file anchor comment blocks from model fields
// actor: worker_bee_infrastructure
// role: builder
// source_truth: implementation

const { FILE_ANCHOR_FIELD_ORDER } = require("../anchor-spec");

// warehouse:method
// responsibility: Assembles file-anchor comment block from model fields with proper formatting
// actor: worker_bee_infrastructure
// role: builder
// source_truth: implementation
function buildAnchorBlock(modelFields, deterministic) {
  const merged = {
    actor: modelFields.actor,
    role: modelFields.role,
    responsibility: modelFields.responsibility,
    expected_location: deterministic.expected_location,
    repo_root_depth: deterministic.repo_root_depth,
    source_truth: modelFields.source_truth,
    mutation_policy: modelFields.mutation_policy,
    generated: modelFields.generated === true ? "true" : "false",
  };
  const lines = ["# warehouse:file"];
  for (const key of FILE_ANCHOR_FIELD_ORDER) {
    let value = merged[key];
    if (value === undefined || value === null || value === "") {
      value = "unknown";
    }
    lines.push(`# ${key}: ${value}`);
  }
  return lines.join("\n");
}

module.exports = { buildAnchorBlock };
