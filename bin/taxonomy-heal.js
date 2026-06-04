#!/usr/bin/env node
// warehouse:file
// responsibility: Applies expected taxonomy remediation JSON by updating declared file and method anchors then verifying coherence acceptance criteria
// actor: taxonomy_healer
// role: repair_worker
// source_truth: implementation

const fs = require("fs");
const path = require("path");
const { extractFromFile } = require("../src/taxonomy/extractor");
const { evaluateFileCoherence } = require("../src/story-analysis/coherence-evaluator");

// warehouse:method
// responsibility: Applies expected taxonomy remediation JSON by updating declared file and method anchors then verifying coherence acceptance criteria
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatFileAnchor(fileTaxonomy) {
  return [
    "// warehouse:file",
    `// responsibility: ${fileTaxonomy.responsibility}`,
    `// actor: ${fileTaxonomy.actor}`,
    `// role: ${fileTaxonomy.role}`,
    `// source_truth: ${fileTaxonomy.source_truth || "implementation"}`,
  ];
}

// warehouse:method
// responsibility: Applies expected taxonomy remediation JSON by updating declared file and method anchors then verifying coherence acceptance criteria
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatMethodAnchor(methodTaxonomy) {
  return [
    "// warehouse:method",
    `// responsibility: ${methodTaxonomy.responsibility}`,
    `// actor: ${methodTaxonomy.actor || "method_implementation"}`,
    `// role: ${methodTaxonomy.role || "implementation"}`,
    `// source_truth: ${methodTaxonomy.source_truth || "implementation"}`,
  ];
}

// warehouse:method
// responsibility: Applies expected taxonomy remediation JSON by updating declared file and method anchors then verifying coherence acceptance criteria
// actor: method_implementation
// role: implementation
// source_truth: implementation
function replaceFileAnchor(content, fileTaxonomy) {
  const lines = content.split("\n");
  let endIdx = 0;
  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    if (index === 0 && trimmed.startsWith("#!")) continue;
    if (trimmed === "" && endIdx > 0) {
      endIdx = index + 1;
      break;
    }
    if (trimmed.startsWith("//") && (
      trimmed.includes("warehouse:file") ||
      trimmed.includes("responsibility:") ||
      trimmed.includes("actor:") ||
      trimmed.includes("role:") ||
      trimmed.includes("source_truth:")
    )) {
      endIdx = index + 1;
      continue;
    }
    break;
  }
  lines.splice(0, endIdx, ...formatFileAnchor(fileTaxonomy), "");
  return lines.join("\n");
}

// warehouse:method
// responsibility: Applies expected taxonomy remediation JSON by updating declared file and method anchors then verifying coherence acceptance criteria
// actor: method_implementation
// role: implementation
// source_truth: implementation
function replaceMethodAnchors(content, expectedMethods) {
  let lines = content.split("\n");
  for (const expectedMethod of expectedMethods) {
    const methodIndex = lines.findIndex((line) => {
      const trimmed = line.trim();
      return trimmed.startsWith(`function ${expectedMethod.name}(`) ||
        trimmed.startsWith(`async function ${expectedMethod.name}(`) ||
        trimmed.match(new RegExp(`^const\\s+${expectedMethod.name}\\s*=`));
    });
    if (methodIndex < 0) continue;

    let startIdx = methodIndex;
    while (startIdx > 0 && lines[startIdx - 1].trim().startsWith("//")) {
      startIdx -= 1;
    }
    const replacement = formatMethodAnchor(expectedMethod.taxonomy);
    lines.splice(startIdx, methodIndex - startIdx, ...replacement);
  }
  return lines.join("\n");
}

// warehouse:method
// responsibility: Applies expected taxonomy remediation JSON by updating declared file and method anchors then verifying coherence acceptance criteria
// actor: method_implementation
// role: implementation
// source_truth: implementation
function applyExpectedTaxonomy(expectedPath, root) {
  const expected = JSON.parse(fs.readFileSync(expectedPath, "utf8"));
  const filePath = path.resolve(root, expected.path);
  let content = fs.readFileSync(filePath, "utf8");

  if (expected.required_refactorings && expected.required_refactorings.length > 0) {
    throw new Error("Refactoring remediations are not implemented by taxonomy-heal yet");
  }

  const hasAnchorUpdate = (expected.required_changes || []).some((change) => change.type === "anchor_update");
  if (!hasAnchorUpdate) {
    throw new Error("Expected remediation does not declare an anchor_update");
  }

  content = replaceFileAnchor(content, expected.expected_taxonomy.file);
  content = replaceMethodAnchors(content, expected.expected_taxonomy.methods || []);
  fs.writeFileSync(filePath, content, "utf8");

  const taxonomy = extractFromFile(filePath, root);
  const analysis = evaluateFileCoherence(taxonomy);
  return {
    path: expected.path,
    score: analysis.coherenceScore,
    accepted: analysis.coherenceScore === expected.target_score,
  };
}

// warehouse:method
// responsibility: Applies expected taxonomy remediation JSON by updating declared file and method anchors then verifying coherence acceptance criteria
// actor: method_implementation
// role: implementation
// source_truth: implementation
function runTaxonomyHeal() {
  const root = path.resolve(__dirname, "..");
  const expectedPath = process.argv[2] ? path.resolve(root, process.argv[2]) : null;
  if (!expectedPath) {
    console.error("Usage: node bin/taxonomy-heal.js <expected-coherence.json>");
    return 1;
  }
  const result = applyExpectedTaxonomy(expectedPath, root);
  console.log(`Applied expected taxonomy: ${result.path}`);
  console.log(`Coherence: ${result.score}/100`);
  return result.accepted ? 0 : 1;
}

if (require.main === module) {
  try {
    process.exit(runTaxonomyHeal());
  } catch (error) {
    console.error(`Taxonomy heal failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  formatFileAnchor,
  formatMethodAnchor,
  replaceFileAnchor,
  replaceMethodAnchors,
  applyExpectedTaxonomy,
  runTaxonomyHeal,
};
