// warehouse:file
// responsibility: Coordinates formatStoryReport behavior with documented file and method taxonomy evidence
// actor: report_formatter
// role: data_aggregator
// source_truth: implementation

// warehouse:method
// responsibility: Coordinates formatStoryReport behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatStoryReport(stories) {
  const report = {
    generated_at: new Date().toISOString(),
    total_packages: stories.length,
    packages_with_stories: stories.filter(s => s.story !== "(responsibilities need clarity)").length,
    stories
  };

  return report;
}

module.exports = { formatStoryReport };
