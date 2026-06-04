// warehouse:file
// responsibility: Coordinates validateData behavior with documented file and method taxonomy evidence
// actor: data_validator
// role: validator
// source_truth: implementation

// warehouse:method
// responsibility: Coordinates validateData behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function validateData(totalCompleted, metadata) {
  const errors = [];

  if (totalCompleted > metadata.totalNeeded) {
    errors.push(`totalCompleted (${totalCompleted}) > totalNeeded (${metadata.totalNeeded})`);
  }

  if (metadata.totalNeeded <= 0) {
    errors.push(`totalNeeded (${metadata.totalNeeded}) is invalid`);
  }

  const pct = Math.round((totalCompleted / metadata.totalNeeded) * 100);
  if (pct < 0 || pct > 100) {
    errors.push(`percentage (${pct}%) out of range [0, 100]`);
  }

  return errors;
}

module.exports = { validateData };
