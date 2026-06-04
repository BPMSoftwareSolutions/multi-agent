// warehouse:file
// responsibility: Generates complete markdown document with front matter, summary, and individual file stories
// actor: story_reporter
// role: generator
// source_truth: implementation

const { buildNarrative } = require("./narrative-builder");

// warehouse:method
// responsibility: Generates markdown document with front matter, summary, and individual file narratives
// actor: method_implementation
// role: implementation
// source_truth: implementation
function generateMarkdown(analysisData, taxonomyData) {
  const lines = [];

  lines.push("# 📖 Taxonomy Story Report");
  lines.push("");
  lines.push(`**Generated:** ${new Date().toISOString().split("T")[0]}`);
  lines.push(`**Purpose:** Review what the combined file + method taxonomy says about our code`);
  lines.push("");

  lines.push("## Executive Summary");
  lines.push("");
  lines.push(
    `**Overall Health:** ${analysisData.overallHealth}/100 — ` +
    `${analysisData.strongStories}/${analysisData.analyses.length} files have coherent stories`
  );
  lines.push("");
  lines.push("### Key Findings:");
  lines.push("");
  lines.push(`- **Strong Stories (≥70):** ${analysisData.strongStories} files — Coherent narratives`);
  lines.push(
    `- **Moderate (50-70):** ${analysisData.analyses.filter((a) => a.analysis.coherenceScore >= 50 && a.analysis.coherenceScore < 70).length} files — Mostly aligned`
  );
  lines.push(
    `- **Weak (<50):** ${analysisData.weakStories} files — **Potential false narratives**`
  );
  lines.push("");
  lines.push("### What This Means:");
  lines.push("");
  lines.push("When file-level and method-level taxonomies don't align, it suggests either:");
  lines.push("1. **File description is inaccurate** — doesn't reflect what the code actually does");
  lines.push("2. **Methods are poorly documented** — descriptions are too technical/implementation-focused");
  lines.push("3. **False narrative** — file and methods tell contradictory stories");
  lines.push("");

  lines.push("---");
  lines.push("");
  lines.push("## Individual File Stories");
  lines.push("");
  lines.push("Each file below shows:");
  lines.push("- What it claims to do (file-level responsibility)");
  lines.push("- What each method does (method-level responsibilities)");
  lines.push("- How well they align (coherence score & reasoning)");
  lines.push("");

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

module.exports = { generateMarkdown };
