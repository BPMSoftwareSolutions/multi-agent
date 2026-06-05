// warehouse:file
// responsibility: Delegator: orchestrates taxonomy extraction from JavaScript files and outputs report
// actor: taxonomy_extractor
// role: data_exporter
// source_truth: implementation

const fs = require("fs");
const path = require("path");
const { walk } = require("../audit/file-scanner");
const { extractFromFile } = require("./extractor");
const { generateReport } = require("./report-generator");

const root = path.resolve(__dirname, "..");

console.log("📖 Extracting Taxonomy from JavaScript Files\n");

const binFiles = walk(path.join(root, "bin"));
const srcFiles = walk(path.join(root, "src"));
const allFiles = [...binFiles, ...srcFiles].sort();

console.log(`Found ${allFiles.length} JavaScript files\n`);

const extracted = [];
for (const filePath of allFiles) {
  const data = extractFromFile(filePath, root);
  if (data) {
    extracted.push(data);
    const methodStr =
      data.documentedMethods === data.totalMethods
        ? `✅ ${data.documentedMethods}/${data.totalMethods}`
        : `⚠️  ${data.documentedMethods}/${data.totalMethods}`;
    console.log(`${data.path.padEnd(50)} ${methodStr} methods`);
  }
}

const report = generateReport(extracted);

// Ensure reports directory exists
const reportsDir = path.join(root, "reports");
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

const reportPath = path.join(reportsDir, "taxonomy-extracted.json");
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");

console.log("\n═════════════════════════════════════════════════════════════════════════");
console.log("EXTRACTION SUMMARY");
console.log("═════════════════════════════════════════════════════════════════════════\n");
console.log(`Files with taxonomy:        ${extracted.length}/${allFiles.length}`);
console.log(`Total methods found:        ${report.summary.totalMethods}`);
console.log(`Methods with taxonomy:      ${report.summary.documentedMethods}`);
console.log(`Method coverage:            ${report.summary.methodCoverage}%`);
console.log(`\nExtracted to:               ${reportPath}`);
console.log("═════════════════════════════════════════════════════════════════════════");
