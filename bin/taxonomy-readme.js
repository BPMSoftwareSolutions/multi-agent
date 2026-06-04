#!/usr/bin/env node
// warehouse:file
// responsibility: Generates governed README projections from latest verified taxonomy scan and codebase story review artifacts
// actor: taxonomy_readme_cli
// role: report_command
// source_truth: implementation

const path = require("path");
const { writeReadmeProjection } = require("../src/observability/readme-projection");

// warehouse:method
// responsibility: Generates governed README projections from latest verified taxonomy scan and codebase story review artifacts
// actor: method_implementation
// role: implementation
// source_truth: implementation
function runTaxonomyReadme() {
  const rootDir = path.resolve(__dirname, "..");
  const artifacts = writeReadmeProjection(rootDir);
  console.log(`README projection written: ${artifacts.readme}`);
  console.log(`README staleness: ${artifacts.staleness.stale_count === 0 ? "current" : "stale"}`);
  return artifacts.staleness.stale_count === 0 ? 0 : 1;
}

if (require.main === module) {
  try {
    process.exit(runTaxonomyReadme());
  } catch (error) {
    console.error(`README projection failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  runTaxonomyReadme,
};
