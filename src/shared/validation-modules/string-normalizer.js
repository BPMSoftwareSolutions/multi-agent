// warehouse:file
// responsibility: Coordinates toTrimmedString and toStringArray behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation

// warehouse:method
// responsibility: Coordinates toTrimmedString and toStringArray behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function toTrimmedString(value) {
  return typeof value === "string" ? value.trim() || null : null;
}

// warehouse:method
// responsibility: Coordinates toTrimmedString and toStringArray behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function toStringArray(value) {
  if (!value) return [];
  if (!Array.isArray(value)) value = [value];
  return value.map((v) => (typeof v === "string" ? v.trim() : "")).filter((v) => v);
}

module.exports = { toTrimmedString, toStringArray };
