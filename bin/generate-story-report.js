// warehouse:file
// responsibility: Delegator: orchestrates loading analysis files and writing story report
// actor: story_reporter
// role: narrator
// source_truth: implementation

const path = require("path");
const { loadAnalysis } = require("./analysis-file-loader");
const { writeStoryReport } = require("./story-report-writer");

const root = path.resolve(__dirname, "..");
const analysisPath = path.resolve(root, "reports", "story-analysis.json");
const taxonomyPath = path.resolve(root, "reports", "taxonomy-extracted.json");
const reportPath = path.resolve(root, "reports", "STORY-REPORT.md");

console.log("📖 Generating Story Report...\n");

const analysisData = loadAnalysis(analysisPath);
const taxonomyData = loadAnalysis(taxonomyPath);

writeStoryReport(analysisData, taxonomyData, reportPath);
