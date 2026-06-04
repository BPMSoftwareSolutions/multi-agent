// warehouse:file
// responsibility: Normalizes string values to trimmed or null
// actor: shared_infrastructure
// role: normalizer
// source_truth: implementation

function toTrimmedString(value) {
  return typeof value === "string" ? value.trim() || null : null;
}

function toStringArray(value) {
  if (!value) return [];
  if (!Array.isArray(value)) value = [value];
  return value.map((v) => (typeof v === "string" ? v.trim() : "")).filter((v) => v);
}

module.exports = { toTrimmedString, toStringArray };
