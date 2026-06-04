// warehouse:file
// responsibility: Generates comprehensive JSON report of all extracted taxonomies with summary statistics
// actor: report_generator
// role: reporter
// source_truth: implementation

// warehouse:method
// responsibility: Generates comprehensive JSON report of all extracted taxonomies with summary statistics
// actor: method_implementation
// role: implementation
// source_truth: implementation
function generateReport(fileData) {
  const report = {
    generated: new Date().toISOString(),
    summary: {
      totalFiles: fileData.length,
      totalMethods: fileData.reduce((sum, f) => sum + f.totalMethods, 0),
      documentedMethods: fileData.reduce((sum, f) => sum + f.documentedMethods, 0),
      methodCoverage: 0,
    },
    files: fileData,
  };

  if (report.summary.totalMethods > 0) {
    report.summary.methodCoverage = Math.round(
      (report.summary.documentedMethods / report.summary.totalMethods) * 100
    );
  }

  return report;
}

module.exports = { generateReport };
