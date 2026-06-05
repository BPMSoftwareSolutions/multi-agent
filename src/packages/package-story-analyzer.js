// warehouse:file
// responsibility: Delegates package taxonomy loading analysis story generation and canonical story report formatting
// actor: story_generator
// role: analyzer
// source_truth: implementation

const path = require("path");
const { loadPackageTaxonomy } = require("./package-loader");
const { analyzePackageStories, generateStory } = require("./story-analyzer");
const { formatStoryReport } = require("../story-analysis/report-formatter");

const root = path.resolve(__dirname, "..");
const taxonomyPath = path.resolve(root, "reports", "taxonomy-packages.json");

loadPackageTaxonomy(taxonomyPath);
const packages = analyzePackageStories(taxonomyPath);
const stories = Object.values(packages).map(generateStory);
const report = formatStoryReport(stories);

console.log(JSON.stringify(report, null, 2));
