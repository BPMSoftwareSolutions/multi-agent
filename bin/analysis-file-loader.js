// warehouse:file
// responsibility: Coordinates loadAnalysis behavior with documented file and method taxonomy evidence
// actor: file_loader
// role: data_supplier
// source_truth: implementation

const fs = require("fs");

// warehouse:method
// responsibility: Coordinates loadAnalysis behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function loadAnalysis(analysisPath) {
  if (!fs.existsSync(analysisPath)) {
    console.error(`❌ Error: ${analysisPath} not found`);
    console.error("Run: node bin/analyze-story.js");
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(analysisPath, "utf8"));
}

module.exports = { loadAnalysis };
