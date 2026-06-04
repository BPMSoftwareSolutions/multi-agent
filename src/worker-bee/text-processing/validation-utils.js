// warehouse:file
// responsibility: Provides isPlaceholder, isGenericResponsibility functionality
// actor: method_implementation
// role: implementation
// source_truth: implementation

// warehouse:method
// responsibility: Validates whether a value is a placeholder or missing (null, undefined, or empty)
// actor: method_implementation
// role: implementation
// source_truth: implementation
function isPlaceholder(value) {
  return value === null || value === undefined || value === "";
}

// warehouse:method
// responsibility: Validates responsibility field for specificity, rejecting generic or placeholder text
// actor: method_implementation
// role: implementation
// source_truth: implementation
function isGenericResponsibility(value) {
  if (!value || value.length < 10) return true;

  const generic = [
    "module",
    "file",
    "function",
    "utility",
    "helper",
    "tool",
    "process",
    "handle",
  ];
  const lower = value.toLowerCase();
  return generic.some((g) => lower === g);
}

module.exports = {
  isPlaceholder,
  isGenericResponsibility,
};
