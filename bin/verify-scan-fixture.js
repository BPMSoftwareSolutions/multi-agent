// warehouse:file
// responsibility: Provides setupTestData, cleanupTestData functionality
// actor: test_infrastructure
// role: test_helper
// source_truth: implementation

const fs = require("fs");
const path = require("path");

const testDir = path.resolve(__dirname, "..", ".test-data");

// warehouse:method
// responsibility: Creates test data files with complete, incomplete, and missing taxonomy headers for validation testing
// actor: method_implementation
// role: implementation
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
// responsibility: Test-driven validation: removes test data directory and temporary Python test files
// actor: method_implementation
// role: implementation
// source_truth: implementation
function cleanupTestData() {
  if (fs.existsSync(testDir)) {
    const files = fs.readdirSync(testDir);
    files.forEach((f) => fs.unlinkSync(path.join(testDir, f)));
    fs.rmdirSync(testDir);
  }
}

module.exports = { setupTestData, cleanupTestData, testDir };
