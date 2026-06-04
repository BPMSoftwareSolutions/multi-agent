// warehouse:file
// responsibility: Validates taxonomy header completeness by checking required fields are present and non-empty
// actor: audit
// role: header_validator
// source_truth: implementation

// warehouse:method
// responsibility: Validates that header contains all required taxonomy fields with non-empty values
// actor: audit
// role: header_validator
// source_truth: implementation
function isComplete(header) {
  const required = ["warehouse", "responsibility", "actor", "role"];
  return required.every((field) => field in header && header[field]);
}

// warehouse:method
// responsibility: Checks if header has warehouse field with non-empty value
// actor: audit
// role: header_validator
// source_truth: implementation
function hasWarehouseField(header) {
  return "warehouse" in header && header.warehouse && header.warehouse.length > 0;
}

// warehouse:method
// responsibility: Returns list of missing required fields from header for validation diagnostics
// actor: audit
// role: header_validator
// source_truth: implementation
function getMissingFields(header) {
  const required = ["warehouse", "responsibility", "actor", "role"];
  return required.filter((field) => !field in header || !header[field]);
}

module.exports = {
  isComplete,
  hasWarehouseField,
  getMissingFields
};
