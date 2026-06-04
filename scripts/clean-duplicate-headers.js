#!/usr/bin/env node
// warehouse:file
// responsibility: Coordinates cleanFile behavior with documented file and method taxonomy evidence
// actor: maintenance_script
// role: implementation
// source_truth: implementation

/**
 * Clean Duplicate Headers
 * Removes duplicate warehouse:file and warehouse:method headers from source files
 */

const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

// warehouse:method
// responsibility: Coordinates cleanFile behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function cleanFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Remove duplicate warehouse:file headers (keep only first one)
  content = content.replace(/^(\/\/ warehouse:file)\n(\/\/ warehouse:file\n)+/m, '$1\n');

  // Remove duplicate warehouse:method headers (keep only first one in each block)
  content = content.replace(/^(\/\/ warehouse:method)\n(\/\/ warehouse:method\n)+/gm, '$1\n');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

// Find all JavaScript files
const files = globSync('src/**/*.js') + globSync('bin/**/*.js');
const allFiles = [...new Set([...globSync('src/**/*.js'), ...globSync('bin/**/*.js')])];

let cleaned = 0;
for (const file of allFiles) {
  if (cleanFile(file)) {
    console.log(`✅ ${file}`);
    cleaned++;
  }
}

console.log(`\n✅ Cleaned ${cleaned} files`);
