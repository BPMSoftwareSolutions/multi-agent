// warehouse:file
// responsibility: Formats story analysis results into JSON report with metadata
// actor: report_formatter
// role: data_aggregator
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
