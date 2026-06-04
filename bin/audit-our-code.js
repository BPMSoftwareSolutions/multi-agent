#!/usr/bin/env node
// warehouse:file
// responsibility: Audits JavaScript files in bin/ and src/ folders to verify all required taxonomy headers are present
// actor: taxonomy_auditor
// role: audit_tool
// source_truth: implementation

// Audit our own code: check taxonomy on bin/ and src/ folders

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

// warehouse:method
// responsibility: Recursively traverses directory tree and collects all JavaScript file paths
// actor: file_scanner
// role: traverser
// source_truth: implementation
function walk(dir) {
  const files = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...walk(fullPath));
      } else if (entry.isFile() && entry.name.endsWith(".js")) {
        files.push(fullPath);
      }
    }
  } catch (_e) {
    /* skip */
  }
  return files;
}

// warehouse:method
// responsibility: Parses taxonomy header fields from JavaScript file comments into a key-value object
// actor: header_parser
// role: extractor
// source_truth: implementation
function readHeader(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");
    const header = {};

    for (const line of lines) {
      const trimmed = line.trim();
      // Skip shebang and empty lines
      if (trimmed.startsWith("#!") || !trimmed) continue;
      // Stop at first non-comment line
      if (!trimmed.startsWith("//")) break;

      const match = trimmed.match(/^\/\/\s*(\w+):\s*(.+)$/);
      if (match) {
        header[match[1]] = match[2].trim();
      }
    }

    return header;
  } catch (_e) {
    return {};
  }
}

// warehouse:method
// responsibility: Validates that a taxonomy header contains all required fields with non-empty values
// actor: header_validator
// role: validator
// source_truth: implementation
function isComplete(header) {
  const required = ["warehouse", "responsibility", "actor", "role"];
  return required.every((field) => field in header && header[field]);
}

const binFiles = walk(path.join(root, "bin"));
const srcFiles = walk(path.join(root, "src"));
const allFiles = [...binFiles, ...srcFiles].sort();

console.log("🔍 Auditing Our Code — Taxonomy Scan\n");

let complete = 0;
let needsWork = 0;
const missing = [];

for (const filePath of allFiles) {
  const relPath = path.relative(root, filePath);
  const header = readHeader(filePath);

  if (isComplete(header)) {
    complete++;
    console.log(`✅ ${relPath}`);
  } else {
    needsWork++;
    console.log(`❌ ${relPath}`);
    missing.push({ file: relPath, header });
  }
}

console.log("\n═════════════════════════════════════════════════════════════════════════");
console.log(`AUDIT RESULTS:`);
console.log(`═════════════════════════════════════════════════════════════════════════\n`);

console.log(`Total files:     ${allFiles.length}`);
console.log(`Complete:        ${complete}`);
console.log(`Needs work:      ${needsWork}\n`);

if (needsWork > 0) {
  console.log(`FILES MISSING TAXONOMY:\n`);
  missing.forEach((item) => {
    console.log(`${item.file}`);
    console.log(`  Current header: ${JSON.stringify(item.header)}`);
    console.log("");
  });
}

console.log("═════════════════════════════════════════════════════════════════════════");
console.log(`ACTION: Add taxonomy headers to ${needsWork} files`);
console.log("═════════════════════════════════════════════════════════════════════════");

process.exit(needsWork > 0 ? 1 : 0);
