#!/usr/bin/env node
// warehouse:file
// responsibility: Test suite that verifies file anchors match expected taxonomy - compares extracted anchors against expected state
// actor: test_runner
// role: validator
// source_truth: implementation

const fs = require("fs");
const path = require("path");
const { extractFromFile } = require("../src/taxonomy/extractor");

const root = path.resolve(__dirname, "..");

// warehouse:method
// responsibility: Loads the expected taxonomy JSON and parses it into a usable structure
// actor: file_reader
// role: loader
// source_truth: implementation
function loadExpectedTaxonomy(expectedPath) {
  try {
    if (!fs.existsSync(expectedPath)) {
      console.error(`ERROR: Expected taxonomy file not found: ${expectedPath}`);
      process.exit(1);
    }
    const content = fs.readFileSync(expectedPath, "utf8");
    return JSON.parse(content);
  } catch (e) {
    console.error(`ERROR: Failed to load expected taxonomy: ${e.message}`);
    process.exit(1);
  }
}

// warehouse:method
// responsibility: Extracts all JavaScript files from bin and src directories that should have taxonomy
// actor: file_scanner
// role: scanner
// source_truth: implementation
function getAllJavaScriptFiles() {
  const files = [];
  const binDir = path.join(root, "bin");
  const srcDir = path.join(root, "src");

  function scanDir(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.name.endsWith(".js")) {
          files.push(fullPath);
        }
      }
    } catch (_e) {
      // Skip directories that don't exist
    }
  }

  scanDir(binDir);
  scanDir(srcDir);
  return files.sort();
}

// warehouse:method
// responsibility: Compares extracted file-level anchor against expected taxonomy entry and returns detailed match result
// actor: comparator
// role: validator
// source_truth: implementation
function compareFileAnchor(filePath, extracted, expected) {
  const result = {
    filePath,
    matches: true,
    fileAnchor: {
      expected: expected ? expected.file : null,
      actual: extracted ? extracted.file : null,
      differences: [],
    },
  };

  // Check if file has anchors
  if (!extracted) {
    result.matches = false;
    result.fileAnchor.differences.push(
      "File has no taxonomy header (missing warehouse:file)"
    );
    return result;
  }

  // Check if file is expected to have anchors
  if (!expected) {
    result.matches = false;
    result.fileAnchor.differences.push(
      "File has taxonomy header but was not expected in taxonomy"
    );
    return result;
  }

  // Compare file-level responsibility
  if (extracted.file.responsibility !== expected.file.responsibility) {
    result.matches = false;
    result.fileAnchor.differences.push(
      `responsibility mismatch: expected "${expected.file.responsibility}" got "${extracted.file.responsibility}"`
    );
  }

  // Compare file-level actor
  if (extracted.file.actor !== expected.file.actor) {
    result.matches = false;
    result.fileAnchor.differences.push(
      `actor mismatch: expected "${expected.file.actor}" got "${extracted.file.actor}"`
    );
  }

  // Compare file-level role
  if (extracted.file.role !== expected.file.role) {
    result.matches = false;
    result.fileAnchor.differences.push(
      `role mismatch: expected "${expected.file.role}" got "${extracted.file.role}"`
    );
  }

  return result;
}

// warehouse:method
// responsibility: Compares method-level anchors between extracted and expected taxonomy and returns detailed differences
// actor: comparator
// role: validator
// source_truth: implementation
function compareMethodAnchors(filePath, extracted, expected) {
  const result = {
    filePath,
    matches: true,
    methods: {
      expected: expected && expected.methods ? expected.methods.length : 0,
      actual: extracted && extracted.methods ? extracted.methods.length : 0,
      details: [],
    },
  };

  const expectedMethods = expected && expected.methods ? expected.methods : [];
  const actualMethods = extracted && extracted.methods ? extracted.methods : [];

  // Check count mismatch
  if (actualMethods.length !== expectedMethods.length) {
    result.matches = false;
    result.methods.details.push(
      `method count mismatch: expected ${expectedMethods.length} got ${actualMethods.length}`
    );
  }

  // Create a map of actual methods by name for easy lookup
  const actualByName = {};
  for (const method of actualMethods) {
    actualByName[method.name] = method;
  }

  // Check each expected method exists and matches
  for (const expectedMethod of expectedMethods) {
    const actualMethod = actualByName[expectedMethod.name];
    if (!actualMethod) {
      result.matches = false;
      result.methods.details.push(
        `missing method: "${expectedMethod.name}" (expected but not found)`
      );
      continue;
    }

    // Compare method properties
    const methodDiffs = [];
    if (
      actualMethod.taxonomy.responsibility !==
      expectedMethod.taxonomy.responsibility
    ) {
      methodDiffs.push(
        `responsibility: expected "${expectedMethod.taxonomy.responsibility}" got "${actualMethod.taxonomy.responsibility}"`
      );
    }
    if (actualMethod.taxonomy.actor !== expectedMethod.taxonomy.actor) {
      methodDiffs.push(
        `actor: expected "${expectedMethod.taxonomy.actor}" got "${actualMethod.taxonomy.actor}"`
      );
    }
    if (actualMethod.taxonomy.role !== expectedMethod.taxonomy.role) {
      methodDiffs.push(
        `role: expected "${expectedMethod.taxonomy.role}" got "${actualMethod.taxonomy.role}"`
      );
    }

    if (methodDiffs.length > 0) {
      result.matches = false;
      result.methods.details.push(
        `method "${expectedMethod.name}": ${methodDiffs.join("; ")}`
      );
    }
  }

  // Check for unexpected methods
  for (const actualMethod of actualMethods) {
    const found = expectedMethods.find((m) => m.name === actualMethod.name);
    if (!found) {
      result.matches = false;
      result.methods.details.push(
        `unexpected method: "${actualMethod.name}" (found but not expected)`
      );
    }
  }

  return result;
}

// warehouse:method
// responsibility: Formats and prints a detailed verification report showing file-by-file anchor comparison results
// actor: formatter
// role: reporter
// source_truth: implementation
function printReport(
  results,
  allResults,
  passed,
  failed,
  extractedTaxonomy,
  expectedTaxonomy
) {
  console.log("\n" + "═".repeat(80));
  console.log("TAXONOMY ANCHOR VERIFICATION REPORT");
  console.log("═".repeat(80) + "\n");

  console.log(`Total files analyzed:       ${allResults.length}`);
  console.log(`Files passing:              ${passed.length} ✅`);
  console.log(`Files failing:              ${failed.length} ❌`);
  console.log(
    `Success rate:               ${((passed.length / allResults.length) * 100).toFixed(1)}%`
  );

  // Print passing files
  if (passed.length > 0) {
    console.log("\n" + "─".repeat(80));
    console.log("✅ PASSING FILES");
    console.log("─".repeat(80));
    for (const result of passed) {
      const relPath = path.relative(root, result.filePath);
      console.log(`  ✅ ${relPath}`);
    }
  }

  // Print failing files with details
  if (failed.length > 0) {
    console.log("\n" + "─".repeat(80));
    console.log("❌ FAILING FILES");
    console.log("─".repeat(80));
    for (const result of failed) {
      const relPath = path.relative(root, result.filePath);
      console.log(`\n  ❌ ${relPath}`);

      // Print file-level differences
      if (
        result.fileAnchor &&
        result.fileAnchor.differences &&
        result.fileAnchor.differences.length > 0
      ) {
        console.log("     FILE ANCHOR ISSUES:");
        for (const diff of result.fileAnchor.differences) {
          console.log(`       • ${diff}`);
        }
      }

      // Print method-level differences
      if (
        result.methods &&
        result.methods.details &&
        result.methods.details.length > 0
      ) {
        console.log("     METHOD ANCHOR ISSUES:");
        for (const diff of result.methods.details) {
          console.log(`       • ${diff}`);
        }
      }
    }
  }

  // Summary statistics
  console.log("\n" + "─".repeat(80));
  console.log("SUMMARY STATISTICS");
  console.log("─".repeat(80));

  const extractedCount = extractedTaxonomy.files
    ? extractedTaxonomy.files.length
    : 0;
  const expectedCount = expectedTaxonomy.files ? expectedTaxonomy.files.length : 0;

  console.log(`Files in extracted taxonomy: ${extractedCount}`);
  console.log(`Files in expected taxonomy:  ${expectedCount}`);

  if (extractedTaxonomy.summary) {
    console.log(
      `Total methods extracted:    ${extractedTaxonomy.summary.totalMethods || 0}`
    );
    console.log(
      `Total methods documented:   ${extractedTaxonomy.summary.documentedMethods || 0}`
    );
    console.log(
      `Method coverage:            ${extractedTaxonomy.summary.methodCoverage || 0}%`
    );
  }

  console.log("\n" + "═".repeat(80) + "\n");
}

// warehouse:method
// responsibility: Main entry point that orchestrates taxonomy verification - loads expected state, extracts actual state, compares, and reports
// actor: test_orchestrator
// role: coordinator
// source_truth: implementation
function main() {
  const expectedPath = path.join(root, "reports", "taxonomy-extracted.json");

  console.log("📋 Verifying File Anchors Against Expected Taxonomy\n");
  console.log(`Expected taxonomy: ${expectedPath}`);

  // Load expected taxonomy
  const expectedTaxonomy = loadExpectedTaxonomy(expectedPath);
  console.log(`Loaded ${expectedTaxonomy.files.length} expected file anchors\n`);

  // Create a map of expected files by path for easy lookup
  const expectedByPath = {};
  for (const file of expectedTaxonomy.files) {
    expectedByPath[file.path] = file;
  }

  // Get all JavaScript files
  const allFiles = getAllJavaScriptFiles();
  console.log(`Scanning ${allFiles.length} JavaScript files...\n`);

  // Extract and compare each file
  const allResults = [];
  const passed = [];
  const failed = [];

  for (const filePath of allFiles) {
    const relPath = path.relative(root, filePath).replace(/\\/g, "/");
    const extracted = extractFromFile(filePath, root);
    const expected = expectedByPath[relPath];

    // Compare file anchors
    const fileResult = compareFileAnchor(filePath, extracted, expected);

    // Compare method anchors
    const methodResult = compareMethodAnchors(filePath, extracted, expected);

    // Combine results
    const fullResult = {
      filePath,
      matches: fileResult.matches && methodResult.matches,
      fileAnchor: fileResult.fileAnchor,
      methods: methodResult.methods,
    };

    allResults.push(fullResult);

    if (fullResult.matches) {
      passed.push(fullResult);
    } else {
      failed.push(fullResult);
    }
  }

  // Check for expected files not found in filesystem
  for (const [expectedPath, expectedFile] of Object.entries(expectedByPath)) {
    const found = allResults.find(
      (r) => path.relative(root, r.filePath).replace(/\\/g, "/") === expectedPath
    );
    if (!found) {
      const result = {
        filePath: path.join(root, expectedPath),
        matches: false,
        fileAnchor: {
          expected: expectedFile.file,
          actual: null,
          differences: ["File expected in taxonomy but not found on filesystem"],
        },
        methods: {
          expected: expectedFile.methods ? expectedFile.methods.length : 0,
          actual: 0,
          details: ["File not found"],
        },
      };
      allResults.push(result);
      failed.push(result);
    }
  }

  // Print detailed report
  printReport(
    allResults,
    allResults,
    passed,
    failed,
    expectedTaxonomy,
    expectedTaxonomy
  );

  // Exit with appropriate code
  const exitCode = failed.length > 0 ? 1 : 0;
  if (exitCode === 0) {
    console.log("✅ ALL ANCHOR VERIFICATION PASSED\n");
  } else {
    console.log(`❌ ANCHOR VERIFICATION FAILED: ${failed.length} files\n`);
  }
  process.exit(exitCode);
}

main();
