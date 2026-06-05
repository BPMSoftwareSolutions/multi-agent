// warehouse:file
// responsibility: Coordinates sortAndSummarizeContradictions behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation

// warehouse:method
// responsibility: Coordinates sortAndSummarizeContradictions behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function sortAndSummarizeContradictions(allContradictions, totalPackages) {
  // Sort by severity
  const severityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  const sorted = allContradictions.sort((a, b) => {
    const maxSevA = Math.min(...a.contradictions.map(c => severityOrder[c.severity]));
    const maxSevB = Math.min(...b.contradictions.map(c => severityOrder[c.severity]));
    return maxSevA - maxSevB;
  });

  const report = {
    generated_at: new Date().toISOString(),
    total_packages: totalPackages,
    packages_with_contradictions: sorted.length,
    high_severity: sorted.reduce((n, p) =>
      n + p.contradictions.filter(c => c.severity === "HIGH").length, 0
    ),
    medium_severity: sorted.reduce((n, p) =>
      n + p.contradictions.filter(c => c.severity === "MEDIUM").length, 0
    ),
    low_severity: sorted.reduce((n, p) =>
      n + p.contradictions.filter(c => c.severity === "LOW").length, 0
    ),
    contradictions: sorted
  };

  return report;
}

module.exports = { sortAndSummarizeContradictions };
