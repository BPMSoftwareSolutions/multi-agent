// warehouse:file
// responsibility: Delegator: test-driven validation suite for taxonomy header extraction and field validation
// actor: test_suite
// role: test
// source_truth: implementation

// Unit tests for verify-scan: scanner should be simple
// TDD: write tests first, they'll be red, then fix scanner to make them green

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { setupTestData, cleanupTestData, testDir } = require("./verify-scan-fixture");
const { readTaxonomyHeader, isComplete } = require("./verify-scan-validator");

// ============= TESTS =============

console.log("🧪 Scanner Unit Tests (TDD)\n");

setupTestData();

let testsPassed = 0;
let testsFailed = 0;

// Test 1: File with complete taxonomy should be marked "good"
try {
  const goodFile = path.join(testDir, "good_file.py");
  const header = readTaxonomyHeader(goodFile);
  assert.strictEqual(isComplete(header), true, "Complete taxonomy should be detected");
  console.log("✅ Test 1 PASS: Complete taxonomy detected");
  testsPassed++;
} catch (e) {
  console.log("❌ Test 1 FAIL: " + e.message);
  testsFailed++;
}

// Test 2: File missing responsibility should be marked "needs work"
try {
  const missingFile = path.join(testDir, "missing_responsibility.py");
  const header = readTaxonomyHeader(missingFile);
  assert.strictEqual(isComplete(header), false, "Incomplete taxonomy should be detected");
  console.log("✅ Test 2 PASS: Missing responsibility detected");
  testsPassed++;
} catch (e) {
  console.log("❌ Test 2 FAIL: " + e.message);
  testsFailed++;
}

// Test 3: File with no taxonomy should be marked "needs work"
try {
  const noHeader = path.join(testDir, "no_taxonomy.py");
  const header = readTaxonomyHeader(noHeader);
  assert.strictEqual(isComplete(header), false, "Missing taxonomy should be detected");
  console.log("✅ Test 3 PASS: Missing taxonomy detected");
  testsPassed++;
} catch (e) {
  console.log("❌ Test 3 FAIL: " + e.message);
  testsFailed++;
}

// Test 4: Scanner counts should be accurate
try {
  const files = fs.readdirSync(testDir).filter((f) => f.endsWith(".py"));
  let complete = 0;
  let incomplete = 0;

  for (const file of files) {
    const header = readTaxonomyHeader(path.join(testDir, file));
    if (isComplete(header)) {
      complete++;
    } else {
      incomplete++;
    }
  }

  assert.strictEqual(complete, 1, "Should find 1 complete file");
  assert.strictEqual(incomplete, 2, "Should find 2 incomplete files");
  console.log("✅ Test 4 PASS: File counts are accurate (1 complete, 2 incomplete)");
  testsPassed++;
} catch (e) {
  console.log("❌ Test 4 FAIL: " + e.message);
  testsFailed++;
}

cleanupTestData();

// Summary
console.log(`\n═════════════════════════════════════════════════════════════════════════`);
console.log(`Results: ${testsPassed} passed, ${testsFailed} failed`);
console.log(`═════════════════════════════════════════════════════════════════════════`);

if (testsFailed > 0) {
  console.log(
    "\n🔴 TESTS ARE RED — Scanner needs to implement simple taxonomy checking logic"
  );
  process.exit(1);
} else {
  console.log("\n🟢 TESTS ARE GREEN — Scanner is correct");
  process.exit(0);
}
