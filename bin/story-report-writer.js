// warehouse:file
// responsibility: Generates markdown story report and writes to disk
// actor: story_reporter
// role: report_writer
// source_truth: implementation

const fs = require("fs");
const path = require("path");
const { generateMarkdown } = require("../src/story/markdown-generator");

function writeStoryReport(analysisData, taxonomyData, reportPath) {
  const markdown = generateMarkdown(analysisData, taxonomyData);
  fs.writeFileSync(reportPath, markdown, "utf8");

  console.log(`✅ Story report written to: ${reportPath}`);
  console.log("");
  console.log("📊 Summary:");
  console.log(`   Overall Health: ${analysisData.overallHealth}/100`);
  console.log(`   Strong Stories: ${analysisData.strongStories}/${analysisData.analyses.length}`);
  console.log(`   Weak Stories: ${analysisData.weakStories}/${analysisData.analyses.length}`);
  console.log("");
}

module.exports = { writeStoryReport };
