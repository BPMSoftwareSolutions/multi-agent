#!/usr/bin/env node
// warehouse:file
// responsibility: Verifies contract driven observability ascii progress components render named console styles pending states and numeric summaries
// actor: ascii_component_test
// role: validator
// source_truth: implementation

const assert = require("assert");
const {
  formatProgressPercent,
  mergeProgressContract,
  renderProgressBar,
} = require("../src/observability/ascii-components");

// warehouse:method
// responsibility: Verifies contract driven observability ascii progress components render named console styles pending states and numeric summaries
// actor: method_implementation
// role: implementation
// source_truth: implementation
function verifyProgressComponentContract() {
  const contract = mergeProgressContract({
    rendering: {
      width: 10,
      style: "digital_block",
      show_fraction: true,
    },
  });

  assert.strictEqual(
    renderProgressBar({ value: 60, max: 100, contract }),
    "\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591 60/100 60%",
    "digital block renderer should use canonical block glyphs"
  );
  assert.strictEqual(
    renderProgressBar({ value: 50, max: 100, contract: { rendering: { width: 4, style: "segmented" } } }),
    "\u25b0\u25b0\u25b1\u25b1 50%",
    "segmented renderer should use canonical segment glyphs"
  );
  assert.strictEqual(
    renderProgressBar({ value: null, contract: { rendering: { width: 4, style: "thin_line" } } }),
    "\u2500\u2500\u2500\u2500 pending",
    "pending renderer should use selected empty glyph"
  );
  assert.strictEqual(
    renderProgressBar({ value: 100, contract: { rendering: { width: 4, style: "ascii_basic" } } }),
    "[####] 100%",
    "ascii basic renderer should remain explicit fallback"
  );
  assert.strictEqual(
    renderProgressBar({ value: 75, contract: { rendering: { style: "numeric_only" } } }),
    "75%",
    "numeric only renderer should omit bar glyphs"
  );
  assert.strictEqual(formatProgressPercent(150, 100), 100, "percent should clamp high values");
  assert.strictEqual(formatProgressPercent(-10, 100), 0, "percent should clamp low values");
}

// warehouse:method
// responsibility: Verifies contract driven observability ascii progress components render named console styles pending states and numeric summaries
// actor: method_implementation
// role: implementation
// source_truth: implementation
function runAsciiComponentVerification() {
  verifyProgressComponentContract();
  console.log("ASCII component verification passed.");
  return 0;
}

if (require.main === module) {
  process.exit(runAsciiComponentVerification());
}

module.exports = { verifyProgressComponentContract, runAsciiComponentVerification };
