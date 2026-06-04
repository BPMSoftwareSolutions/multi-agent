#!/usr/bin/env node
// warehouse:file
// responsibility: Generates a human-readable markdown narrative of taxonomy stories with coherence analysis and reasoning
// actor: story_reporter
// role: narrator
// source_truth: implementation

const fs = require("fs");
const path = require("path");

// warehouse:method
// responsibility: Reads story analysis JSON and returns parsed data with error handling
// actor: story_reporter
// role: loader
// source_truth: implementation
function loadAnalysis(analysisPath) {
  if (!fs.existsSync(analysisPath)) {
    console.error(`❌ Error: ${analysisPath} not found`);
    console.error("Run: node bin/analyze-story.js");
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(analysisPath, "utf8"));
}

// warehouse:method
// responsibility: Generates health indicator emoji and label based on coherence score
// actor: story_reporter
// role: formatter
// source_truth: implementation
function getHealthIndicator(score) {
  if (score >= 70) return "✅ STRONG";
  if (score >= 50) return "⚠️  MODERATE";
  if (score >= 30) return "❌ WEAK";
  return "🚨 INCOHERENT";
}

// warehouse:method
// responsibility: Builds narrative interpretation of file's story based on responsibility and methods
// actor: story_narrator
// role: interpreter
// source_truth: implementation
function buildNarrative(file, analysis) {
  const narratives = [];

  narratives.push(
    `## **File Story: ${file.file.responsibility}**`
  );
  narratives.push("");
  narratives.push(
    `**Actor:** ${file.file.actor} | **Role:** ${file.file.role} | **Source:** ${file.file.source_truth}`
  );
  narratives.push("");

  // Build method narrative
  if (file.methods.length === 0) {
    narratives.push("*No methods to document.*");
  } else {
    narratives.push("### What the Methods Do:");
    narratives.push("");

    for (const method of file.methods) {
      const isAligned = method.taxonomy.responsibility.toLowerCase().includes(
        file.file.responsibility.split(/\s+/)[0].toLowerCase()
      );
      const indicator = isAligned ? "✓" : "✗";

      narratives.push(
        `${indicator} **${method.name}()** — ${method.taxonomy.responsibility}`
      );
    }
  }

  narratives.push("");

  // Coherence analysis
  narratives.push("### Story Coherence Analysis:");
  narratives.push("");
  narratives.push(
    `**Health:** ${getHealthIndicator(analysis.coherenceScore)} (${analysis.coherenceScore}/100)`
  );
  narratives.push(
    `**Methods Aligned:** ${analysis.alignedMethods}/${analysis.totalMethods}`
  );
  narratives.push("");

  // Issues and reasoning
  if (analysis.issues.length > 0) {
    narratives.push("#### Issues Detected:");
    narratives.push("");

    for (const issue of analysis.issues) {
      narratives.push(
        `- **${issue.method}()** (${issue.similarity}% alignment)`
      );
      narratives.push(
        `  - Says: "${issue.methodResp}"`
      );
      if (issue.flags && issue.flags.length > 0) {
        narratives.push(`  - Flags: ${issue.flags.join(", ")}`);
      }
      narratives.push("");
    }
  } else {
    narratives.push("✅ No major coherence issues detected.");
    narratives.push("");
  }

  // Narrative interpretation
  const alignmentPercent = analysis.totalMethods > 0
    ? Math.round((analysis.alignedMethods / analysis.totalMethods) * 100)
    : 0;

  narratives.push("#### What the Story Says:");
  narratives.push("");

  if (analysis.coherenceScore >= 70) {
    narratives.push(
      `The file's purpose (${file.file.responsibility}) is well-supported by its methods. ` +
      `Each method contributes meaningfully to the overall responsibility.`
    );
  } else if (analysis.coherenceScore >= 50) {
    narratives.push(
      `The file's methods generally support its stated purpose, though some ` +
      `methods diverge into technical implementation details. ` +
      `The narrative is mostly coherent with ${alignmentPercent}% method alignment.`
    );
  } else if (analysis.coherenceScore >= 30) {
    narratives.push(
      `⚠️  **FALSE NARRATIVE WARNING:** The file claims to "${file.file.responsibility}" ` +
      `but many methods (${100 - alignmentPercent}%) describe unrelated technical tasks. ` +
      `The file's description may not accurately reflect what it actually does.`
    );
  } else {
    narratives.push(
      `🚨 **INCOHERENT STORY:** The file's stated purpose ` +
      `("${file.file.responsibility}") is almost entirely disconnected from ` +
      `what its methods actually do. This represents a broken narrative where ` +
      `the description and implementation tell contradictory stories.`
    );
  }

  narratives.push("");

  return narratives.join("\n");
}

// warehouse:method
// responsibility: Generates complete markdown document with front matter, summary, and individual file stories
// actor: story_reporter
// role: generator
// source_truth: implementation
function generateMarkdown(analysisData, taxonomyData) {
  const lines = [];

  // Header
  lines.push("# 📖 Taxonomy Story Report");
  lines.push("");
  lines.push(
    `**Generated:** ${new Date().toISOString().split("T")[0]}`
  );
  lines.push(
    `**Purpose:** Review what the combined file + method taxonomy says about our code`
  );
  lines.push("");

  // Executive Summary
  lines.push("## Executive Summary");
  lines.push("");
  lines.push(
    `**Overall Health:** ${analysisData.overallHealth}/100 — ` +
    `${analysisData.strongStories}/${analysisData.analyses.length} files have coherent stories`
  );
  lines.push("");
  lines.push("### Key Findings:");
  lines.push("");
  lines.push(
    `- **Strong Stories (≥70):** ${analysisData.strongStories} files — Coherent narratives`
  );
  lines.push(
    `- **Moderate (50-70):** ${analysisData.analyses.filter((a) => a.analysis.coherenceScore >= 50 && a.analysis.coherenceScore < 70).length} files — Mostly aligned`
  );
  lines.push(
    `- **Weak (<50):** ${analysisData.weakStories} files — **Potential false narratives**`
  );
  lines.push("");
  lines.push(
    "### What This Means:"
  );
  lines.push("");
  lines.push(
    "When file-level and method-level taxonomies don't align, it suggests either:"
  );
  lines.push("1. **File description is inaccurate** — doesn't reflect what the code actually does");
  lines.push(
    "2. **Methods are poorly documented** — descriptions are too technical/implementation-focused"
  );
  lines.push("3. **False narrative** — file and methods tell contradictory stories");
  lines.push("");

  // Story Details
  lines.push("---");
  lines.push("");
  lines.push("## Individual File Stories");
  lines.push("");
  lines.push("Each file below shows:");
  lines.push("- What it claims to do (file-level responsibility)");
  lines.push("- What each method does (method-level responsibilities)");
  lines.push("- How well they align (coherence score & reasoning)");
  lines.push("");

  // Add each file's story
  for (const analysis of analysisData.analyses) {
    const fileData = taxonomyData.files.find((f) => f.path === analysis.path);
    if (fileData) {
      lines.push(buildNarrative(fileData, analysis.analysis));
      lines.push("---");
      lines.push("");
    }
  }

  return lines.join("\n");
}

// warehouse:method
// responsibility: Orchestrates loading analysis data and writing markdown story report to file and console summary
// actor: story_reporter
// role: orchestrator
// source_truth: implementation
function main() {
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
  console.log(
    `   Overall Health: ${analysisData.overallHealth}/100`
  );
  console.log(
    `   Strong Stories: ${analysisData.strongStories}/${analysisData.analyses.length}`
  );
  console.log(
    `   Weak Stories: ${analysisData.weakStories}/${analysisData.analyses.length}`
  );
  console.log("");
}

main();
