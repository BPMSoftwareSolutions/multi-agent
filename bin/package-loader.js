// warehouse:file
// responsibility: Loads and validates package taxonomy from disk
// actor: file_loader
// role: data_supplier
// source_truth: implementation

const fs = require("fs");

function loadPackageTaxonomy(taxonomyPath) {
  if (!fs.existsSync(taxonomyPath)) {
    console.error(`Taxonomy report not found: ${taxonomyPath}`);
    console.error("Run: node bin/taxonomy-report.js --output reports/taxonomy-packages.json");
    process.exit(1);
  }
  return fs.readFileSync(taxonomyPath, "utf8");
}

module.exports = { loadPackageTaxonomy };
