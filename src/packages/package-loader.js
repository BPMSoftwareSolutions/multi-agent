// warehouse:file
// responsibility: Coordinates loadPackageTaxonomy behavior with documented file and method taxonomy evidence
// actor: file_loader
// role: data_supplier
// source_truth: implementation

const fs = require("fs");

// warehouse:method
// responsibility: Coordinates loadPackageTaxonomy behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function loadPackageTaxonomy(taxonomyPath) {
  if (!fs.existsSync(taxonomyPath)) {
    console.error(`Taxonomy report not found: ${taxonomyPath}`);
    console.error("Run: node bin/taxonomy-report.js --output reports/taxonomy-packages.json");
    process.exit(1);
  }
  return fs.readFileSync(taxonomyPath, "utf8");
}

module.exports = { loadPackageTaxonomy };
