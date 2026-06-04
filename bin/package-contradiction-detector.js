#!/usr/bin/env node
// warehouse:file
// responsibility: Delegator: analyzes package taxonomy and detects contradictions
// actor: contradiction_analyzer
// role: validator
// source_truth: implementation

const fs = require("fs");
const path = require("path");
const { analyzePackages, detectContradictions } = require("../src/packages/contradiction-detector");

const taxonomyPath = path.resolve(__dirname, "..", "reports", "taxonomy-packages.json");
if (!fs.existsSync(taxonomyPath)) {
  console.error(`Taxonomy report not found: ${taxonomyPath}`);
  process.exit(1);
}

const packages = analyzePackages(taxonomyPath);

const allContradictions = [];
for (const pkg of Object.values(packages)) {
  const contradictions = detectContradictions(pkg);
  if (contradictions.length > 0) {
    allContradictions.push({
      package: pkg.name,
      files: pkg.files.length,
      contradictions
    });
  }
}

// Sort by severity
const severityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
allContradictions.sort((a, b) => {
  const maxSevA = Math.min(...a.contradictions.map(c => severityOrder[c.severity]));
  const maxSevB = Math.min(...b.contradictions.map(c => severityOrder[c.severity]));
  return maxSevA - maxSevB;
});

const report = {
  generated_at: new Date().toISOString(),
  total_packages: Object.keys(packages).length,
  packages_with_contradictions: allContradictions.length,
  high_severity: allContradictions.reduce((n, p) =>
    n + p.contradictions.filter(c => c.severity === "HIGH").length, 0
  ),
  medium_severity: allContradictions.reduce((n, p) =>
    n + p.contradictions.filter(c => c.severity === "MEDIUM").length, 0
  ),
  low_severity: allContradictions.reduce((n, p) =>
    n + p.contradictions.filter(c => c.severity === "LOW").length, 0
  ),
  contradictions: allContradictions
};

console.log(JSON.stringify(report, null, 2));
