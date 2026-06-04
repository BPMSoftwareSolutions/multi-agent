// warehouse:file
// responsibility: Provides isComplete, hasWarehouseField, getMissingFields functionality
// actor: method_implementation
// role: implementation
// source_truth: implementation

// warehouse:method
// responsibility: undefined — isComplete
// actor: method_implementation
// role: implementation
// source_truth: implementation
function isComplete(header) {
  const required = ["warehouse", "responsibility", "actor", "role"];
  return required.every((field) => field in header && header[field]);
}

// warehouse:method
// responsibility: undefined — hasWarehouseField
// actor: method_implementation
// role: implementation
// source_truth: implementation
function hasWarehouseField(header) {
  return "warehouse" in header && header.warehouse && header.warehouse.length > 0;
}

// warehouse:method
// responsibility: undefined — getMissingFields
// actor: method_implementation
// role: implementation
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
