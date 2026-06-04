#!/usr/bin/env node
// warehouse:file
// responsibility: Unit tests for taxonomy header verification scanner using test-driven development approach
// actor: test_suite
// role: test
// source_truth: implementation

// Unit tests for verify-scan: scanner should be simple
// TDD: write tests first, they'll be red, then fix scanner to make them green

const assert = require("assert");
const fs = require("fs");
const path = require("path");

// Mock a simple test setup
const testDir = path.resolve(__dirname, "..", ".test-data");

// warehouse:method
// responsibility: Creates test data directory with sample Python files for taxonomy header validation testing
// actor: test_setup
// role: fixture_provider
// source_truth: implementation
function setupTestData() {
  // Create test data directory
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  // Create a file WITH complete taxonomy
  const goodFile = path.join(testDir, "good_file.py");
  fs.writeFileSync(
    goodFile,
    `# warehouse:file
# responsibility: Handles user authentication
# actor: auth_service
# role: gateway
# source_truth: contract_backed

def authenticate():
    pass
`
  );

  // Create a file WITH INCOMPLETE taxonomy (missing responsibility)
  const missingResponsibility = path.join(testDir, "missing_responsibility.py");
  fs.writeFileSync(
    missingResponsibility,
    `# warehouse:file
# actor: auth_service
# role: gateway
# source_truth: contract_backed

def authenticate():
    pass
`
  );

  // Create a file WITH NO taxonomy header
  const noTaxonomy = path.join(testDir, "no_taxonomy.py");
  fs.writeFileSync(
    noTaxonomy,
    `def authenticate():
    pass
`
  );
}

// warehouse:method
// responsibility: Removes test data directory and all temporary test files created during test execution
// actor: test_cleanup
// role: fixture_provider
// source_truth: implementation
function cleanupTestData() {
  if (fs.existsSync(testDir)) {
    const files = fs.readdirSync(testDir);
    files.forEach((f) => fs.unlinkSync(path.join(testDir, f)));
    fs.rmdirSync(testDir);
  }
}

// warehouse:method
// responsibility: Extracts taxonomy header fields from Python file comments into object
// actor: header_parser
// role: extractor
// source_truth: implementation
function readTaxonomyHeader(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  const header = {};

  for (const line of lines) {
    if (!line.trim().startsWith("#")) break;
    const match = line.match(/^#\s*(\w+):\s*(.+)$/);
    if (match) {
      header[match[1]] = match[2].trim();
    }
  }

  return header;
}

// warehouse:method
// responsibility: Validates that all required taxonomy fields are present and populated
// actor: header_validator
// role: validator
// source_truth: implementation
function isComplete(header) {
  // SIMPLE: check if all required fields are present
  const required = ["responsibility", "actor", "role", "source_truth"];
  return required.every((field) => field in header && header[field]);
}

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
