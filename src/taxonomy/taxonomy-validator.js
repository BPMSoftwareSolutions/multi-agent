// warehouse:file
// responsibility: Validates that taxonomy object contains required warehouse:file and warehouse:method header fields
// actor: method_implementation
// role: implementation
// source_truth: implementation

// warehouse:method
// warehouse:method
// warehouse:method
// responsibility: Validates that taxonomy object contains required warehouse:file and warehouse:method header fields
// actor: method_implementation
// role: implementation
// source_truth: implementation
function isValidTaxonomy(taxonomy) {
  const required = ["warehouse", "responsibility", "actor", "role"];
  return required.every((field) => field in taxonomy && taxonomy[field]);
}

module.exports = { isValidTaxonomy };
