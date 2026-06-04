// warehouse:file
// responsibility: Delegator: audits JavaScript files for taxonomy header completeness and displays summary
// actor: taxonomy_auditor
// role: audit_tool
// source_truth: implementation

const path = require("path");
const { auditFiles } = require("../src/audit/auditor");

const root = path.resolve(__dirname, "..");

console.log("🔍 Auditing Our Code — Taxonomy Scan\n");

const { allFiles, complete, needsWork, missing } = auditFiles(root);

for (const filePath of allFiles) {
  const relPath = path.relative(root, filePath);
  const item = missing.find((m) => m.file === relPath);
  if (item) {
    console.log(`❌ ${relPath}`);
  } else {
    console.log(`✅ ${relPath}`);
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
