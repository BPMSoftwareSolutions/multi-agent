// warehouse:file
// responsibility: Delegator: analyzes packages and generates story report as JSON
// actor: story_generator
// role: analyzer
// source_truth: implementation

const fs = require("fs");
const path = require("path");
const { analyzePackageStories, generateStory } = require("../src/packages/story-analyzer");

const taxonomyPath = path.resolve(__dirname, "..", "reports", "taxonomy-packages.json");
if (!fs.existsSync(taxonomyPath)) {
  console.error(`Taxonomy report not found: ${taxonomyPath}`);
  console.error("Run: node bin/taxonomy-report.js --output reports/taxonomy-packages.json");
  process.exit(1);
}

const packages = analyzePackageStories(taxonomyPath);
const stories = Object.values(packages)
  .map(generateStory)
  .sort((a, b) => a.package.localeCompare(b.package));

const report = {
  generated_at: new Date().toISOString(),
  total_packages: stories.length,
  packages_with_stories: stories.filter(s => s.story !== "(responsibilities need clarity)").length,
  stories
};

console.log(JSON.stringify(report, null, 2));
