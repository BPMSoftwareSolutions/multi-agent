// warehouse:file
// responsibility: Loads JSON analysis files from disk by path with validation
// actor: file_loader
// role: data_supplier
// source_truth: implementation

const fs = require("fs");

function loadAnalysis(analysisPath) {
  if (!fs.existsSync(analysisPath)) {
    console.error(`❌ Error: ${analysisPath} not found`);
    console.error("Run: node bin/analyze-story.js");
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(analysisPath, "utf8"));
}

module.exports = { loadAnalysis };
