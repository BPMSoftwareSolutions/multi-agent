// warehouse:file
// responsibility: Validates that header contains all required taxonomy fields with non-empty values
// actor: audit
// role: header_validator
// source_truth: implementation

// warehouse:method
// responsibility: undefined
// actor: undefined
// role: undefined
// source_truth: implementation

function isComplete(header) {
  const required = ["warehouse", "responsibility", "actor", "role"];
  return required.every((field) => field in header && header[field]);
}

// warehouse:method
// responsibility: undefined
// actor: undefined
// role: undefined
// source_truth: implementation

function hasWarehouseField(header) {
  return "warehouse" in header && header.warehouse && header.warehouse.length > 0;
}

// warehouse:method
// responsibility: undefined
// actor: undefined
// role: undefined
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
