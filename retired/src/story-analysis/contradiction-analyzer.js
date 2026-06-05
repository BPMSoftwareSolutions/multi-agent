// warehouse:file
// responsibility: Coordinates analyzePackagesForContradictions behavior with documented file and method taxonomy evidence
// actor: contradiction_analyzer
// role: validator
// source_truth: implementation

const { analyzePackages, detectContradictions } = require("../packages/contradiction-detector");

// warehouse:method
// responsibility: Coordinates analyzePackagesForContradictions behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
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
