#!/usr/bin/env node
// warehouse:file
// responsibility: Coordinates testUpdater behavior with documented file and method taxonomy evidence
// actor: test_runner
// role: validator
// source_truth: implementation

/**
 * Verify Updater Test
 * Ensures updater produces files that match expected_taxonomy.json exactly
 */

const fs = require('fs');
const path = require('path');
const { extractFromFile } = require('../src/taxonomy/extractor');

const expectedPath = path.resolve(__dirname, '..', 'reports', 'expected_taxonomy.json');
const projectRoot = path.resolve(__dirname, '..');

// warehouse:method
// responsibility: Coordinates testUpdater behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function testUpdater() {
  console.log('📋 Testing Updater Data-Driven Behavior\n');

  // Load expected taxonomy
  const expected = JSON.parse(fs.readFileSync(expectedPath, 'utf8'));

  let passed = 0;
  let failed = 0;
  const mismatches = [];

  // For each file in expected taxonomy, extract from disk and compare
  for (const expectedFile of expected.files) {
    const filePath = path.join(projectRoot, expectedFile.path);

    if (!fs.existsSync(filePath)) {
      mismatches.push({ path: expectedFile.path, reason: 'File not found on disk' });
      failed++;
      continue;
    }

    // Extract current state from file
    const actual = extractFromFile(filePath, projectRoot);

    if (!actual) {
      mismatches.push({ path: expectedFile.path, reason: 'Failed to extract taxonomy from file' });
      failed++;
      continue;
    }

    // Compare file-level responsibility
    if (actual.file.responsibility !== expectedFile.file.responsibility) {
      mismatches.push({
        path: expectedFile.path,
        reason: 'File responsibility mismatch',
        expected: expectedFile.file.responsibility,
        actual: actual.file.responsibility
      });
      failed++;
      continue;
    }

    // Compare method count
    if (actual.methods.length !== expectedFile.methods.length) {
      mismatches.push({
        path: expectedFile.path,
        reason: `Method count mismatch (expected ${expectedFile.methods.length}, got ${actual.methods.length})`
      });
      failed++;
      continue;
    }

    // Compare each method
    let methodsMatch = true;
    for (const actualMethod of actual.methods) {
      const expectedMethod = expectedFile.methods.find(m => m.name === actualMethod.name);
      if (!expectedMethod) {
        mismatches.push({
          path: expectedFile.path,
          reason: `Method not in expected: ${actualMethod.name}`
        });
        methodsMatch = false;
        break;
      }

      if (actualMethod.taxonomy.responsibility !== expectedMethod.taxonomy.responsibility) {
        mismatches.push({
          path: expectedFile.path,
          reason: `Method responsibility mismatch for ${actualMethod.name}`,
          expected: expectedMethod.taxonomy.responsibility,
          actual: actualMethod.taxonomy.responsibility
        });
        methodsMatch = false;
        break;
      }
    }

    if (methodsMatch) {
      passed++;
    } else {
      failed++;
    }
  }

  // Report results
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Total: ${passed + failed}\n`);

  if (mismatches.length > 0) {
    console.log('First 10 mismatches:');
    for (let i = 0; i < Math.min(10, mismatches.length); i++) {
      const m = mismatches[i];
      console.log(`\n${i + 1}. ${m.path}`);
      console.log(`   ${m.reason}`);
      if (m.expected) console.log(`   Expected: ${m.expected.substring(0, 60)}...`);
      if (m.actual) console.log(`   Actual:   ${m.actual.substring(0, 60)}...`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  if (failed === 0) {
    console.log('✅ ALL FILES MATCH EXPECTED TAXONOMY');
    return 0;
  } else {
    console.log(`❌ ${failed} files do not match expected_taxonomy.json`);
    return 1;
  }
}

process.exit(testUpdater());
