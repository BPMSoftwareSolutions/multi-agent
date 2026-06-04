#!/usr/bin/env node
// warehouse:file
// responsibility: Produces taxonomy scan evidence bundle by detecting JavaScript functions extracting anchors comparing coverage evaluating coherence and writing audit JSON
// actor: taxonomy_evidence
// role: evidence_builder
// source_truth: implementation

const fs = require("fs");
const path = require("path");
const { extractFromFile } = require("../src/taxonomy/extractor");
const { isValidTaxonomy } = require("../src/taxonomy/taxonomy-validator");
const { evaluateFileCoherence } = require("../src/story-analysis/coherence-evaluator");

// warehouse:method
// responsibility: Produces taxonomy scan evidence bundle by detecting JavaScript functions extracting anchors comparing coverage evaluating coherence and writing audit JSON
// actor: method_implementation
// role: implementation
// source_truth: implementation
function detectJavaScriptFunctions(content) {
  const functions = [];
  const lines = content.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    let match = trimmed.match(/^(?:async\s+)?function\s+(\w+)\s*\(/);
    if (!match) {
      match = trimmed.match(/^const\s+(\w+)\s*=\s*(?:async\s*)?(?:function\b|\([^)]*\)\s*=>|\w+\s*=>)/);
    }
    if (match) {
      functions.push({ name: match[1], line: index + 1 });
    }
  }
  return functions;
}

// warehouse:method
// responsibility: Produces taxonomy scan evidence bundle by detecting JavaScript functions extracting anchors comparing coverage evaluating coherence and writing audit JSON
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildFileEvidence(filePath, root) {
  const absPath = path.resolve(root, filePath);
  const relPath = path.relative(root, absPath).replace(/\\/g, "/");
  const content = fs.readFileSync(absPath, "utf8");
  const detectedFunctions = detectJavaScriptFunctions(content);
  const taxonomy = extractFromFile(absPath, root);
  const taxonomyMethods = taxonomy ? taxonomy.methods : [];
  const documentedMethods = taxonomyMethods.filter((method) => isValidTaxonomy(method.taxonomy));
  const taxonomyNames = new Set(taxonomyMethods.map((method) => method.name));
  const documentedNames = new Set(documentedMethods.map((method) => method.name));
  const missingFromTaxonomy = detectedFunctions.filter((fn) => !taxonomyNames.has(fn.name));
  const undocumented = detectedFunctions.filter((fn) => !documentedNames.has(fn.name));
  const unexpectedTaxonomy = taxonomyMethods
    .filter((method) => !detectedFunctions.find((fn) => fn.name === method.name))
    .map((method) => method.name);
  const functionCoverage = detectedFunctions.length
    ? Math.round(((detectedFunctions.length - missingFromTaxonomy.length) / detectedFunctions.length) * 100)
    : 100;
  const documentedCoverage = detectedFunctions.length
    ? Math.round(((detectedFunctions.length - undocumented.length) / detectedFunctions.length) * 100)
    : 100;
  const coherence = taxonomy ? evaluateFileCoherence(taxonomy) : null;

  return {
    path: relPath,
    detected_functions: detectedFunctions,
    taxonomy_methods: taxonomyMethods.map((method) => ({
      name: method.name,
      documented: isValidTaxonomy(method.taxonomy),
      responsibility: method.taxonomy.responsibility || "",
    })),
    coverage: {
      detected_function_count: detectedFunctions.length,
      taxonomy_method_count: taxonomyMethods.length,
      documented_method_count: documentedMethods.length,
      function_coverage: functionCoverage,
      documented_coverage: documentedCoverage,
      missing_from_taxonomy: missingFromTaxonomy,
      undocumented,
      unexpected_taxonomy: unexpectedTaxonomy,
    },
    coherence: coherence
      ? {
          score: coherence.coherenceScore,
          aligned_methods: coherence.alignedMethods,
          total_methods: coherence.totalMethods,
          issues: coherence.issues,
        }
      : null,
    trustworthy:
      !!taxonomy &&
      functionCoverage === 100 &&
      documentedCoverage === 100 &&
      unexpectedTaxonomy.length === 0 &&
      coherence.coherenceScore === 100,
  };
}

// warehouse:method
// responsibility: Produces taxonomy scan evidence bundle by detecting JavaScript functions extracting anchors comparing coverage evaluating coherence and writing audit JSON
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildEvidenceBundle(files, root) {
  const evidence = files.map((file) => buildFileEvidence(file, root));
  return {
    schema: "taxonomy-evidence-bundle.v1",
    generated: new Date().toISOString(),
    root,
    summary: {
      files: evidence.length,
      trustworthy_files: evidence.filter((item) => item.trustworthy).length,
      untrustworthy_files: evidence.filter((item) => !item.trustworthy).length,
    },
    evidence,
  };
}

// warehouse:method
// responsibility: Produces taxonomy scan evidence bundle by detecting JavaScript functions extracting anchors comparing coverage evaluating coherence and writing audit JSON
// actor: method_implementation
// role: implementation
// source_truth: implementation
function runEvidenceBundle() {
  const root = path.resolve(__dirname, "..");
  const args = process.argv.slice(2);
  const outputIndex = args.indexOf("--output");
  const outputPath = outputIndex >= 0
    ? path.resolve(root, args[outputIndex + 1])
    : path.join(root, "reports", "taxonomy-evidence-bundle.json");
  const files = args.filter((arg, index) => arg !== "--output" && index !== outputIndex + 1);

  if (files.length === 0) {
    console.error("Usage: node bin/taxonomy-evidence-bundle.js <file.js> [...] [--output reports/evidence.json]");
    return 1;
  }

  const bundle = buildEvidenceBundle(files, root);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(bundle, null, 2), "utf8");
  console.log(`Evidence bundle written: ${outputPath}`);
  console.log(`Trustworthy files: ${bundle.summary.trustworthy_files}/${bundle.summary.files}`);
  return bundle.summary.untrustworthy_files === 0 ? 0 : 1;
}

if (require.main === module) {
  process.exit(runEvidenceBundle());
}

module.exports = {
  detectJavaScriptFunctions,
  buildFileEvidence,
  buildEvidenceBundle,
  runEvidenceBundle,
};
