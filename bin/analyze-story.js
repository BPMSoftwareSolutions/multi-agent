#!/usr/bin/env node
// warehouse:file
// responsibility: Analyzes extracted taxonomy to detect story coherence, contradictions, and false narratives across files and methods
// actor: story_analyzer
// role: validator
// source_truth: implementation

const fs = require("fs");
const path = require("path");

// warehouse:method
// responsibility: Extracts key concepts and verbs from responsibility text for semantic comparison
// actor: text_analyzer
// role: tokenizer
// source_truth: implementation
function extractConcepts(text) {
  if (!text) return { words: [], verbs: [], nouns: [] };

  const words = text.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const verbs = words.filter(
    (w) =>
      w.endsWith("s") ||
      w.endsWith("ing") ||
      w.endsWith("ed") ||
      ["manages", "handles", "validates", "generates", "extracts", "parses"].includes(w)
  );
  const nouns = words.filter((w) => !verbs.includes(w));

  return { words, verbs, nouns };
}

// warehouse:method
// responsibility: Computes semantic similarity between two responsibility texts using word overlap
// actor: similarity_engine
// role: comparator
// source_truth: implementation
function computeSimilarity(fileResp, methodResp) {
  const fileConcepts = extractConcepts(fileResp);
  const methodConcepts = extractConcepts(methodResp);

  const overlap = fileConcepts.words.filter((w) => methodConcepts.words.includes(w)).length;
  const maxLength = Math.max(fileConcepts.words.length, methodConcepts.words.length);

  return maxLength > 0 ? (overlap / maxLength) * 100 : 0;
}

// warehouse:method
// responsibility: Detects red flags indicating method responsibility contradicts file responsibility
// actor: contradiction_detector
// role: validator
// source_truth: implementation
function detectRedFlags(fileResp, methodResp) {
  const flags = [];
  const methodLower = methodResp.toLowerCase();

  // Check for generic/placeholder descriptions
  if (methodLower.match(/^(helper|utility|internal|function|method|process|handle)/i)) {
    flags.push("generic_responsibility");
  }

  // Check for maintenance/cleanup (might indicate technical debt)
  if (methodLower.match(/(cleanup|reset|clear|remove|delete|deprecat)/i)) {
    flags.push("maintenance_task");
  }

  // Check for error handling only (might be isolated from main flow)
  if (methodLower.match(/^(catch|handle|recover from)/i)) {
    flags.push("error_only");
  }

  // Check for vague/unclear purpose
  if (methodLower.split(/\s+/).length < 3) {
    flags.push("too_vague");
  }

  return flags;
}

// warehouse:method
// responsibility: Evaluates coherence of a single file against its methods using multiple heuristics
// actor: coherence_evaluator
// role: scorer
// source_truth: implementation
function evaluateFileCoherence(file) {
  if (file.methods.length === 0) {
    return {
      fileResp: file.file.responsibility,
      coherenceScore: 100,
      alignedMethods: 0,
      totalMethods: 0,
      analysisNote: "no_methods_to_validate",
      issues: [],
    };
  }

  const fileResp = file.file.responsibility;
  let totalSimilarity = 0;
  let alignedMethods = 0;
  const issues = [];

  for (const method of file.methods) {
    const similarity = computeSimilarity(fileResp, method.taxonomy.responsibility);
    const flags = detectRedFlags(fileResp, method.taxonomy.responsibility);

    if (similarity >= 50) {
      alignedMethods++;
    } else {
      issues.push({
        method: method.name,
        methodResp: method.taxonomy.responsibility,
        similarity: Math.round(similarity),
        flags,
      });
    }

    totalSimilarity += similarity;
  }

  const coherenceScore = Math.round(totalSimilarity / file.methods.length);

  return {
    fileResp,
    coherenceScore,
    alignedMethods,
    totalMethods: file.methods.length,
    issues,
  };
}

// warehouse:method
// responsibility: Generates human-readable narrative analysis of story coherence across all files
// actor: report_generator
// role: formatter
// source_truth: implementation
function generateReport(taxonomyData) {
  const analyses = [];

  for (const file of taxonomyData.files) {
    analyses.push({
      path: file.path,
      analysis: evaluateFileCoherence(file),
    });
  }

  // Sort by coherence score (weak first)
  analyses.sort((a, b) => a.analysis.coherenceScore - b.analysis.coherenceScore);

  const avgScore = Math.round(
    analyses.reduce((sum, a) => sum + a.analysis.coherenceScore, 0) / analyses.length
  );
  const strongStories = analyses.filter((a) => a.analysis.coherenceScore >= 70).length;
  const weakStories = analyses.filter((a) => a.analysis.coherenceScore < 50).length;

  return {
    overallHealth: avgScore,
    strongStories,
    weakStories,
    analyses,
  };
}

// warehouse:method
// responsibility: Formats and outputs story analysis report to console and JSON file
// actor: report_writer
// role: formatter
// source_truth: implementation
function writeReport(report, taxonomyPath) {
  const reportRoot = path.dirname(taxonomyPath);
  const reportFile = path.join(reportRoot, "story-analysis.json");

  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), "utf8");

  console.log("\n📖 STORY COHERENCE ANALYSIS\n");
  console.log("═════════════════════════════════════════════════════════════════════════");
  console.log(`Overall Health Score: ${report.overallHealth}/100`);
  console.log(`Strong Stories (≥70):  ${report.strongStories}/${report.analyses.length}`);
  console.log(`Weak Stories (<50):    ${report.weakStories}/${report.analyses.length}`);
  console.log("═════════════════════════════════════════════════════════════════════════\n");

  if (report.weakStories > 0) {
    console.log("⚠️  WEAK STORIES (needs coherence work):\n");
    for (const a of report.analyses) {
      if (a.analysis.coherenceScore < 50) {
        console.log(`❌ ${a.path} — Score: ${a.analysis.coherenceScore}/100`);
        console.log(`   File: "${a.analysis.fileResp.substring(0, 70)}..."`);
        if (a.analysis.issues.length > 0) {
          for (const issue of a.analysis.issues) {
            console.log(`   └─ ${issue.method}: "${issue.methodResp.substring(0, 60)}..."`);
            console.log(`      Alignment: ${issue.similarity}% ${issue.flags.length > 0 ? `| Flags: ${issue.flags.join(", ")}` : ""}`);
          }
        }
        console.log();
      }
    }
  }

  console.log("\n✅ STRONG STORIES (coherent narrative):\n");
  const strongCount = Math.min(5, report.analyses.filter((a) => a.analysis.coherenceScore >= 70).length);
  for (let i = 0; i < strongCount; i++) {
    const a = report.analyses[report.analyses.length - 1 - i];
    if (a.analysis.coherenceScore >= 70) {
      console.log(
        `✅ ${a.path} — Score: ${a.analysis.coherenceScore}/100 (${a.analysis.alignedMethods}/${a.analysis.totalMethods} methods aligned)`
      );
    }
  }

  console.log(`\n📊 Full analysis written to: ${reportFile}`);
  console.log("═════════════════════════════════════════════════════════════════════════\n");
}

// warehouse:method
// responsibility: Orchestrates loading taxonomy JSON and running complete story coherence analysis
// actor: story_analyzer
// role: orchestrator
// source_truth: implementation
function main() {
  const taxonomyPath = path.resolve(__dirname, "..", "reports", "taxonomy-extracted.json");

  if (!fs.existsSync(taxonomyPath)) {
    console.error(`❌ Error: ${taxonomyPath} not found`);
    console.error("Run: node bin/extract-taxonomy.js");
    process.exit(1);
  }

  console.log("🔍 Analyzing story coherence...\n");

  const taxonomyData = JSON.parse(fs.readFileSync(taxonomyPath, "utf8"));
  const report = generateReport(taxonomyData);

  writeReport(report, taxonomyPath);
}

main();
