// warehouse:file
// responsibility: Analyzes packages and detects contradictions within each package
// actor: contradiction_analyzer
// role: validator
// source_truth: implementation

const { analyzePackages, detectContradictions } = require("../src/packages/contradiction-detector");

function analyzePackagesForContradictions(taxonomyPath) {
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

  return allContradictions;
}

module.exports = { analyzePackagesForContradictions };
