// warehouse:file
// responsibility: Audits JavaScript files for taxonomy header completeness
// actor: taxonomy_auditor
// role: audit_tool
// source_truth: implementation

const path = require("path");
const { walk } = require("./file-scanner");
const { readHeader, isComplete } = require("./header-parser");

// warehouse:method
// responsibility: Scans JavaScript files and classifies by taxonomy completeness
// actor: auditor
// role: classifier
// source_truth: implementation
function auditFiles(root) {
  const binFiles = walk(path.join(root, "bin"));
  const srcFiles = walk(path.join(root, "src"));
  const allFiles = [...binFiles, ...srcFiles].sort();

  let complete = 0;
  let needsWork = 0;
  const missing = [];

  for (const filePath of allFiles) {
    const relPath = path.relative(root, filePath);
    const header = readHeader(filePath);

    if (isComplete(header)) {
      complete++;
    } else {
      needsWork++;
      missing.push({ file: relPath, header });
    }
  }

  return { allFiles, complete, needsWork, missing };
}

module.exports = { auditFiles };
