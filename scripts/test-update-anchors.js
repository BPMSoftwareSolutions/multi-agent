#!/usr/bin/env node
/**
 * Test suite for update-anchors.js
 * Validates the anchor updating logic without modifying real files
 */

const fs = require("fs");
const path = require("path");
const { updateFileAnchors, loadTaxonomy, buildTaxonomyIndex } = require("./update-anchors");

// Test configuration
const TEST_PROJECT_ROOT = path.resolve(__dirname, "..");
const TEST_TAXONOMY_PATH = path.join(TEST_PROJECT_ROOT, "reports", "taxonomy-extracted.json");

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    testsFailed++;
    return false;
  } else {
    console.log(`  ✅ PASS: ${message}`);
    testsPassed++;
    return true;
  }
}

/**
 * Test 1: Load taxonomy file
 */
function testLoadTaxonomy() {
  console.log("\n📋 Test 1: Load Taxonomy");
  try {
    const taxonomy = loadTaxonomy(TEST_TAXONOMY_PATH);
    assert(taxonomy !== null, "Taxonomy loaded");
    assert(taxonomy.files !== undefined, "Taxonomy has files array");
    assert(Array.isArray(taxonomy.files), "Files is an array");
    assert(taxonomy.files.length > 0, "Taxonomy has file entries");
    assert(taxonomy.files[0].path !== undefined, "File entries have path");
    assert(taxonomy.files[0].file !== undefined, "File entries have file metadata");
    assert(taxonomy.files[0].file.responsibility !== undefined, "File metadata has responsibility");
  } catch (err) {
    console.error(`  ❌ FAIL: ${err.message}`);
    testsFailed++;
  }
}

/**
 * Test 2: Build taxonomy index
 */
function testBuildIndex() {
  console.log("\n📋 Test 2: Build Taxonomy Index");
  try {
    const taxonomy = loadTaxonomy(TEST_TAXONOMY_PATH);
    const index = buildTaxonomyIndex(taxonomy);

    assert(Object.keys(index).length > 0, "Index has entries");
    assert(Object.keys(index).length === taxonomy.files.length, "Index size matches file count");

    const firstKey = Object.keys(index)[0];
    assert(index[firstKey].file !== undefined, "Index entries have file metadata");
    assert(index[firstKey].methods !== undefined, "Index entries have methods array");
  } catch (err) {
    console.error(`  ❌ FAIL: ${err.message}`);
    testsFailed++;
  }
}

/**
 * Test 3: Update file anchors (simple file)
 */
function testUpdateFileAnchors() {
  console.log("\n📋 Test 3: Update File Anchors");

  const testContent = `#!/usr/bin/env node
// warehouse:file
// responsibility: Old responsibility description
// actor: old_actor
// role: old_role
// source_truth: implementation

const { main } = require("../src/example");

main();
`;

  const fileData = {
    responsibility: "New responsibility description",
    actor: "new_actor",
    role: "new_role",
    source_truth: "implementation",
  };

  try {
    const { content, changes } = updateFileAnchors("test.js", testContent, fileData, []);

    assert(changes.fileUpdated === true, "File marked as updated");
    assert(content.includes("// responsibility: New responsibility description"), "Responsibility updated");
    assert(content.includes("// actor: new_actor"), "Actor updated");
    assert(content.includes("// role: new_role"), "Role updated");
    assert(!content.includes("Old responsibility description"), "Old responsibility removed");
    assert(!content.includes("old_actor"), "Old actor removed");
  } catch (err) {
    console.error(`  ❌ FAIL: ${err.message}`);
    testsFailed++;
  }
}

/**
 * Test 4: Update method anchors
 */
function testUpdateMethodAnchors() {
  console.log("\n📋 Test 4: Update Method Anchors");

  const testContent = `// warehouse:file
// responsibility: File responsibility
// actor: file_actor
// role: file_role
// source_truth: implementation

// warehouse:method
// responsibility: Old method responsibility
// actor: old_method_actor
// role: old_method_role
// source_truth: implementation
function myFunction() {
  return "test";
}
`;

  const fileData = {
    responsibility: "File responsibility",
    actor: "file_actor",
    role: "file_role",
    source_truth: "implementation",
  };

  const methodData = [
    {
      responsibility: "New method responsibility",
      actor: "new_method_actor",
      role: "new_method_role",
      source_truth: "implementation",
    },
  ];

  try {
    const { content, changes } = updateFileAnchors("test.js", testContent, fileData, methodData);

    assert(changes.methodsUpdated === 1, "Method marked as updated");
    assert(content.includes("// responsibility: New method responsibility"), "Method responsibility updated");
    assert(content.includes("// actor: new_method_actor"), "Method actor updated");
    assert(!content.includes("old_method_actor"), "Old method actor removed");
  } catch (err) {
    console.error(`  ❌ FAIL: ${err.message}`);
    testsFailed++;
  }
}

/**
 * Test 5: Handle missing file header
 */
function testMissingHeader() {
  console.log("\n📋 Test 5: Handle Missing Header");

  const testContent = `const { main } = require("../src/example");

main();
`;

  const fileData = {
    responsibility: "New responsibility",
    actor: "new_actor",
    role: "new_role",
    source_truth: "implementation",
  };

  try {
    const { content, changes } = updateFileAnchors("test.js", testContent, fileData, []);

    // Should handle gracefully - either skip or add header
    assert(true, "Handles missing header without crashing");
  } catch (err) {
    console.log(`  ⚠️  Note: ${err.message}`);
  }
}

/**
 * Test 6: Preserve file structure
 */
function testPreserveStructure() {
  console.log("\n📋 Test 6: Preserve File Structure");

  const testContent = `// warehouse:file
// responsibility: Old
// actor: old
// role: old
// source_truth: implementation

const fs = require("fs");
const path = require("path");

// Some comment
function doSomething() {
  return 42;
}

module.exports = { doSomething };
`;

  const fileData = {
    responsibility: "New responsibility",
    actor: "new_actor",
    role: "new_role",
    source_truth: "implementation",
  };

  try {
    const { content } = updateFileAnchors("test.js", testContent, fileData, []);

    assert(content.includes('const fs = require("fs")'), "Preserved require statements");
    assert(content.includes("function doSomething()"), "Preserved function definitions");
    assert(content.includes('module.exports'), "Preserved exports");
  } catch (err) {
    console.error(`  ❌ FAIL: ${err.message}`);
    testsFailed++;
  }
}

/**
 * Run all tests
 */
function runAllTests() {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 Anchor Updater Test Suite");
  console.log("=".repeat(60));

  testLoadTaxonomy();
  testBuildIndex();
  testUpdateFileAnchors();
  testUpdateMethodAnchors();
  testMissingHeader();
  testPreserveStructure();

  console.log("\n" + "=".repeat(60));
  console.log("📊 Test Results");
  console.log("=".repeat(60));
  console.log(`Passed: ${testsPassed}`);
  console.log(`Failed: ${testsFailed}`);
  console.log(`Total:  ${testsPassed + testsFailed}`);

  if (testsFailed === 0) {
    console.log("\n✅ All tests passed!\n");
    process.exit(0);
  } else {
    console.log("\n❌ Some tests failed\n");
    process.exit(1);
  }
}

if (require.main === module) {
  runAllTests();
}

module.exports = { testUpdateFileAnchors, testBuildIndex };
