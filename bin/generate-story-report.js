#!/usr/bin/env node
// warehouse:file
// responsibility: Delegator: loads analysis data and writes markdown story report
// actor: story_reporter
// role: narrator
// source_truth: implementation

const fs = require("fs");
const path = require("path");
const { generateMarkdown } = require("../src/story/markdown-generator");

function loadAnalysis(analysisPath) {
  if (!fs.existsSync(analysisPath)) {
    console.error(`❌ Error: ${analysisPath} not found`);
    console.error("Run: node bin/analyze-story.js");
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(analysisPath, "utf8"));
}

const analysisPath = path.resolve(__dirname, "..", "reports", "story-analysis.json");
const taxonomyPath = path.resolve(__dirname, "..", "reports", "taxonomy-extracted.json");

console.log("📖 Generating Story Report...\n");

const analysisData = loadAnalysis(analysisPath);
const taxonomyData = loadAnalysis(taxonomyPath);

const markdown = generateMarkdown(analysisData, taxonomyData);

const reportPath = path.resolve(__dirname, "..", "reports", "STORY-REPORT.md");
fs.writeFileSync(reportPath, markdown, "utf8");

console.log(`✅ Story report written to: ${reportPath}`);
console.log("");
console.log("📊 Summary:");
console.log(`   Overall Health: ${analysisData.overallHealth}/100`);
console.log(`   Strong Stories: ${analysisData.strongStories}/${analysisData.analyses.length}`);
console.log(`   Weak Stories: ${analysisData.weakStories}/${analysisData.analyses.length}`);
console.log("");
