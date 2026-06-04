// warehouse:file
// responsibility: Writes coherence analysis report object to JSON file in reports directory
// actor: persistence_layer
// role: writer
// source_truth: implementation

const fs = require("fs");
const path = require("path");

// warehouse:method
// responsibility: Writes coherence analysis report object to JSON file in reports directory
// actor: method_implementation
// role: implementation
// source_truth: implementation
function writeReportFile(report, taxonomyPath) {
  const reportRoot = path.dirname(taxonomyPath);
  const reportFile = path.join(reportRoot, "story-analysis.json");
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), "utf8");
  return reportFile;
}

module.exports = { writeReportFile };
