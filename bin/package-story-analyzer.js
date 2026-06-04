// warehouse:file
// responsibility: Delegator: orchestrates package story analysis and report generation
// actor: story_generator
// role: analyzer
// source_truth: implementation

const path = require("path");
const { loadPackageTaxonomy } = require("./package-loader");
const { analyzeAndGenerateStories } = require("./story-analyzer");
const { formatStoryReport } = require("./story-report-formatter");

const root = path.resolve(__dirname, "..");
const taxonomyPath = path.resolve(root, "reports", "taxonomy-packages.json");

loadPackageTaxonomy(taxonomyPath);
const stories = analyzeAndGenerateStories(taxonomyPath);
const report = formatStoryReport(stories);

console.log(JSON.stringify(report, null, 2));
