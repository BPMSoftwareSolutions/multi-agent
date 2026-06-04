#!/usr/bin/env node
// warehouse:file
// responsibility: Python taxonomy verifier: scans configured folder, collects all Python files, validates taxonomy header completeness, reports TOUCHED/UNTOUCHED counts and status
// actor: taxonomy_verifier
// role: audit_tool
// source_truth: implementation

// Deterministic scanner: check if taxonomy is complete
// SIMPLE: just check if required fields are present
// Config-driven path, scan all Python files, report counts

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
for (const name of [".env.local", ".env"]) {
  const p = path.join(root, name);
  if (fs.existsSync(p)) require("dotenv").config({ path: p });
}

const config = JSON.parse(fs.readFileSync(path.join(root, ".worker-bee.json"), "utf8"));
const DEFAULT_REPO_ROOT = process.env.WORKER_BEE_REPO_ROOT || config.repoRoot || "C:/source/repos/bpm/internal/ai-engine";
const DEFAULT_TARGET = path.resolve(DEFAULT_REPO_ROOT, config.defaultTarget || "packages");

// warehouse:method
// responsibility: Recursively traverses directory tree and collects all files with specified extension
// actor: file_scanner
// role: traverser
// source_truth: implementation
function walk(dir, ext = ".py") {
  const files = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...walk(fullPath, ext));
      } else if (entry.isFile() && entry.name.endsWith(ext)) {
        files.push(fullPath);
      }
    }
  } catch (_e) {
    /* skip inaccessible dirs */
  }
  return files;
}

// warehouse:method
// responsibility: Parses Python file header for taxonomy fields using comment marker prefix
// actor: header_parser
// role: extractor
// source_truth: implementation
function readTaxonomyHeader(filePath) {
  try {
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
  } catch (_e) {
    return {};
  }
}

// warehouse:method
// responsibility: Validates that taxonomy header contains all required fields with values
// actor: header_validator
// role: validator
// source_truth: implementation
function isComplete(header) {
  const required = ["responsibility", "actor", "role", "source_truth"];
  return required.every((field) => field in header && header[field]);
}

async function main() {
  console.log("🔍 Taxonomy Scanner\n");
  console.log(`Target: ${DEFAULT_TARGET}\n`);

  const startTime = Date.now();

  // Scan all Python files
  const allFiles = walk(DEFAULT_TARGET);
  console.log(`Found ${allFiles.length} Python files\n`);

  // Classify each file
  let complete = 0;
  let needsWork = 0;

  for (const filePath of allFiles) {
    const header = readTaxonomyHeader(filePath);
    if (isComplete(header)) {
      complete++;
    } else {
      needsWork++;
    }
  }

  const elapsed = Date.now() - startTime;

  // Report: simple counts
  console.log("═════════════════════════════════════════════════════════════════════════");
  console.log("TAXONOMY STATUS:");
  console.log("═════════════════════════════════════════════════════════════════════════\n");

  console.log(`Total Python files:     ${allFiles.length}`);
  console.log(`Complete taxonomy:      ${complete}`);
  console.log(`Needs work:             ${needsWork}`);
  console.log(`Scan time:              ${elapsed}ms\n`);

  console.log("═════════════════════════════════════════════════════════════════════════");
  console.log(`BASELINE: ${needsWork} files need taxonomy work`);
  console.log("═════════════════════════════════════════════════════════════════════════");
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
