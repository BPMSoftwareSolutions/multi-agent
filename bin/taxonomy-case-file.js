// warehouse:file
// responsibility: Produces single file taxonomy case artifacts by scanning actual anchors diagnosing incoherence deduplicating subsumed responsibilities planning expected coherent taxonomy and writing remediation evidence and Produces single file taxonomy case artifacts by scanning actual anchors diagnosing incoherence planning expected coherent taxonomy and writing remediation evidence
// actor: taxonomy_case_builder
// role: evidence_builder
// source_truth: implementation

const fs = require("fs");
const path = require("path");
const { extractFromFile } = require("../src/taxonomy/extractor");
const { evaluateFileCoherence } = require("../src/story-analysis/coherence-evaluator");
const { buildFileEvidence } = require("./taxonomy-evidence-bundle");

// warehouse:method
// responsibility: Produces single file taxonomy case artifacts by scanning actual anchors diagnosing incoherence deduplicating subsumed responsibilities planning expected coherent taxonomy and writing remediation evidence and Produces single file taxonomy case artifacts by scanning actual anchors diagnosing incoherence planning expected coherent taxonomy and writing remediation evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function collapseRepeatedResponsibility(responsibility) {
  const marker = " and ";
  let index = responsibility.indexOf(marker);
  while (index >= 0) {
    const left = responsibility.slice(0, index);
    const right = responsibility.slice(index + marker.length);
    if (left === right) {
      return left;
    }
    index = responsibility.indexOf(marker, index + marker.length);
  }
  const parts = responsibility.split(marker).map((part) => part.trim()).filter(Boolean);
  if (parts.length > 1) {
    const collapsedParts = removeSubsumedResponsibilities(parts);
    if (collapsedParts.length < parts.length) {
      return collapsedParts.join(marker);
    }
  }
  return responsibility;
}

// warehouse:method
// responsibility: Produces single file taxonomy case artifacts by scanning actual anchors diagnosing incoherence deduplicating subsumed responsibilities planning expected coherent taxonomy and writing remediation evidence and Produces single file taxonomy case artifacts by scanning actual anchors diagnosing incoherence planning expected coherent taxonomy and writing remediation evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function removeSubsumedResponsibilities(responsibilities) {
  return responsibilities.filter((responsibility) => {
    return !responsibilities.some((other) => other !== responsibility && other.includes(responsibility));
  });
}

// warehouse:method
// responsibility: Produces single file taxonomy case artifacts by scanning actual anchors diagnosing incoherence deduplicating subsumed responsibilities planning expected coherent taxonomy and writing remediation evidence and Produces single file taxonomy case artifacts by scanning actual anchors diagnosing incoherence planning expected coherent taxonomy and writing remediation evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function synthesizeExpectedResponsibility(taxonomy, evidence) {
  const methodResponsibilities = taxonomy.methods
    .filter((method) => method.taxonomy && method.taxonomy.responsibility)
    .map((method) => collapseRepeatedResponsibility(method.taxonomy.responsibility.replace(/\s+/g, " ").trim()));
  const uniqueResponsibilities = removeSubsumedResponsibilities([...new Set(methodResponsibilities)]);
  if (uniqueResponsibilities.length > 0) {
    return uniqueResponsibilities.join(" and ");
  }
  const functionNames = evidence.detected_functions.map((fn) => fn.name).join(" and ");
  return `Coordinates ${functionNames} behavior with documented file and method taxonomy evidence`;
}

// warehouse:method
// responsibility: Produces single file taxonomy case artifacts by scanning actual anchors diagnosing incoherence deduplicating subsumed responsibilities planning expected coherent taxonomy and writing remediation evidence and Produces single file taxonomy case artifacts by scanning actual anchors diagnosing incoherence planning expected coherent taxonomy and writing remediation evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildExpectedCoherence(filePath, taxonomy, analysis, evidence) {
  const methodNames = evidence.detected_functions.map((fn) => fn.name);
  const hasGeneratedProvidesAnchor = /^Provides .+ functionality$/i.test(taxonomy.file.responsibility || "");
  const sharedResponsibility = synthesizeExpectedResponsibility(taxonomy, evidence);
  const expectedMethods = methodNames.map((name) => ({
    name,
    taxonomy: {
      warehouse: "method",
      responsibility: sharedResponsibility,
      actor: "method_implementation",
      role: "implementation",
      source_truth: "implementation",
    },
  }));

  return {
    schema: "expected-coherence-remediation.v1",
    path: filePath,
    current_score: analysis.coherenceScore,
    target_score: 100,
    diagnosis: {
      failure_type: hasGeneratedProvidesAnchor ? "anchor_only_generated_file_claim" : "coherence_mismatch",
      summary: "File-level responsibility does not align with method-level evidence.",
      issues: analysis.issues,
    },
    expected_taxonomy: {
      file: {
        warehouse: "file",
        responsibility: sharedResponsibility,
        actor: taxonomy.file.actor || "progress_monitor",
        role: taxonomy.file.role || "watcher",
        source_truth: taxonomy.file.source_truth || "implementation",
      },
      methods: expectedMethods,
    },
    required_changes: [
      {
        type: "anchor_update",
        reason: "Replace generated function-list file claim with a responsibility that matches evidence from detected functions.",
        file_level: true,
        method_level: expectedMethods.map((method) => method.name),
      },
    ],
    required_refactorings: [],
    acceptance_criteria: [
      "Every detected function appears in taxonomy evidence.",
      "Every detected function has a documented warehouse:method anchor.",
      "File and method responsibilities evaluate to 100/100 coherence.",
    ],
  };
}

// warehouse:method
// responsibility: Produces single file taxonomy case artifacts by scanning actual anchors diagnosing incoherence deduplicating subsumed responsibilities planning expected coherent taxonomy and writing remediation evidence and Produces single file taxonomy case artifacts by scanning actual anchors diagnosing incoherence planning expected coherent taxonomy and writing remediation evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatIncoherenceReport(filePath, analysis, evidence, expected) {
  const lines = [
    `# Taxonomy Case File: ${filePath}`,
    "",
    `Current coherence: ${analysis.coherenceScore}/100`,
    `Target coherence: ${expected.target_score}/100`,
    `Trustworthy evidence: ${evidence.trustworthy ? "yes" : "no"}`,
    "",
    "## Coverage",
    "",
    `Detected functions: ${evidence.coverage.detected_function_count}`,
    `Taxonomy methods: ${evidence.coverage.taxonomy_method_count}`,
    `Documented methods: ${evidence.coverage.documented_method_count}`,
    `Function coverage: ${evidence.coverage.function_coverage}%`,
    `Documented coverage: ${evidence.coverage.documented_coverage}%`,
    "",
    "## Problem",
    "",
    expected.diagnosis.summary,
    "",
    "## Method Issues",
    "",
  ];

  if (analysis.issues.length === 0) {
    lines.push("No method-level issues reported.");
  } else {
    for (const issue of analysis.issues) {
      lines.push(`- ${issue.method}: similarity ${issue.similarity}% below threshold ${issue.threshold}%`);
    }
  }

  lines.push("", "## Required Changes", "");
  for (const change of expected.required_changes) {
    lines.push(`- ${change.type}: ${change.reason}`);
  }
  if (expected.required_refactorings.length === 0) {
    lines.push("- refactoring: none required for this case; anchor repair is sufficient.");
  }
  lines.push("");

  return lines.join("\n");
}

// warehouse:method
// responsibility: Produces single file taxonomy case artifacts by scanning actual anchors diagnosing incoherence deduplicating subsumed responsibilities planning expected coherent taxonomy and writing remediation evidence and Produces single file taxonomy case artifacts by scanning actual anchors diagnosing incoherence planning expected coherent taxonomy and writing remediation evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildTaxonomyCaseFile(filePath, root, outputRoot) {
  const absPath = path.resolve(root, filePath);
  const relPath = path.relative(root, absPath).replace(/\\/g, "/");
  const taxonomy = extractFromFile(absPath, root);
  if (!taxonomy) {
    throw new Error(`Could not extract taxonomy from ${relPath}`);
  }
  const analysis = evaluateFileCoherence(taxonomy);
  const evidence = buildFileEvidence(relPath, root);
  const expected = buildExpectedCoherence(relPath, taxonomy, analysis, evidence);
  const caseDir = path.join(outputRoot, relPath.replace(/[\\/]/g, "__").replace(/\.js$/, ""));

  fs.mkdirSync(caseDir, { recursive: true });
  fs.writeFileSync(path.join(caseDir, "actual-taxonomy.json"), JSON.stringify(taxonomy, null, 2), "utf8");
  fs.writeFileSync(path.join(caseDir, "evidence.json"), JSON.stringify(evidence, null, 2), "utf8");
  fs.writeFileSync(path.join(caseDir, "expected-coherence.json"), JSON.stringify(expected, null, 2), "utf8");
  fs.writeFileSync(path.join(caseDir, "incoherence-report.md"), formatIncoherenceReport(relPath, analysis, evidence, expected), "utf8");

  return {
    path: relPath,
    case_dir: path.relative(root, caseDir).replace(/\\/g, "/"),
    current_score: analysis.coherenceScore,
    target_score: expected.target_score,
    required_changes: expected.required_changes.length,
    required_refactorings: expected.required_refactorings.length,
  };
}

// warehouse:method
// responsibility: Produces single file taxonomy case artifacts by scanning actual anchors diagnosing incoherence deduplicating subsumed responsibilities planning expected coherent taxonomy and writing remediation evidence and Produces single file taxonomy case artifacts by scanning actual anchors diagnosing incoherence planning expected coherent taxonomy and writing remediation evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function runTaxonomyCaseFile() {
  const root = path.resolve(__dirname, "..");
  const args = process.argv.slice(2);
  const outputIndex = args.indexOf("--output-root");
  const file = args.find((arg, index) => !arg.startsWith("--") && index !== outputIndex + 1);
  const outputRoot = outputIndex >= 0
    ? path.resolve(root, args[outputIndex + 1])
    : path.join(root, "reports", "taxonomy-case-files");

  if (!file) {
    console.error("Usage: node bin/taxonomy-case-file.js <file.js> [--output-root reports/taxonomy-case-files]");
    return 1;
  }

  const result = buildTaxonomyCaseFile(file, root, outputRoot);
  console.log(`Taxonomy case file written: ${result.case_dir}`);
  console.log(`Current coherence: ${result.current_score}/100`);
  console.log(`Target coherence: ${result.target_score}/100`);
  return 0;
}

if (require.main === module) {
  try {
    process.exit(runTaxonomyCaseFile());
  } catch (error) {
    console.error(`Taxonomy case file failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  collapseRepeatedResponsibility,
  removeSubsumedResponsibilities,
  synthesizeExpectedResponsibility,
  buildExpectedCoherence,
  formatIncoherenceReport,
  buildTaxonomyCaseFile,
  runTaxonomyCaseFile,
};
