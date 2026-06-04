// warehouse:file
// responsibility: Python taxonomy verifier: validates taxonomy header completeness and reports status
// actor: taxonomy_verifier
// role: audit_tool
// source_truth: implementation

// Deterministic scanner: check if taxonomy is complete
// SIMPLE: just check if required fields are present
// Config-driven path, scan all Python files, report counts

const fs = require("fs");
const path = require("path");
const { walk } = require("../src/scanner/file-walker");
const { readTaxonomyHeader, isComplete } = require("../src/scanner/header-parser");

const root = path.resolve(__dirname, "..");
for (const name of [".env.local", ".env"]) {
  const p = path.join(root, name);
  if (fs.existsSync(p)) require("dotenv").config({ path: p });
}

const config = JSON.parse(fs.readFileSync(path.join(root, ".worker-bee.json"), "utf8"));
const DEFAULT_REPO_ROOT = process.env.WORKER_BEE_REPO_ROOT || config.repoRoot || "C:/source/repos/bpm/internal/ai-engine";
const DEFAULT_TARGET = path.resolve(DEFAULT_REPO_ROOT, config.defaultTarget || "packages");

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
