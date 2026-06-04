// warehouse:file
// responsibility: Coordinates requireString and optionalString behavior with documented file and method taxonomy evidence
// actor: server_runtime
// role: runtime_component
// source_truth: implementation

// warehouse:method
// responsibility: Coordinates requireString and optionalString behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function requireString(body, fieldName) {
  const value = body ? body[fieldName] : undefined;
  if (typeof value !== "string" || value.trim() === "") {
    return `${fieldName} is required and must be a non-empty string`;
  }
  return null;
}

// warehouse:method
// responsibility: Coordinates requireString and optionalString behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function optionalString(body, fieldName) {
  const value = body ? body[fieldName] : undefined;
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return `${fieldName} must be a string when provided`;
  }

  return null;
}

module.exports = {
  requireString,
  optionalString
};
