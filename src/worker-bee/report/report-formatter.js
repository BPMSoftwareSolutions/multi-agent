// warehouse:file
// responsibility: Formats taxonomy report into human-readable or machine-readable output representations
// actor: worker_bee_infrastructure
// role: report_formatter
// source_truth: implementation

// warehouse:method
// responsibility: Formats taxonomy report to JSON or plain text output representation
// actor: worker_bee_infrastructure
// role: report_formatter
// source_truth: implementation
function formatReport(report, format = "json") {
  if (format === "json") {
    return JSON.stringify(report, null, 2);
  }

  // Plain text format
  const lines = [
    "=== Taxonomy Report ===",
    `Generated: ${report.generated_at}`,
    `Repository: ${report.repo_root}`,
    "",
    "--- Summary ---"
  ];

  if (report.summary) {
    for (const [key, value] of Object.entries(report.summary)) {
      lines.push(`${key}: ${value}`);
    }
  }

  lines.push("");
  lines.push(`Total files: ${(report.files || []).length}`);

  return lines.join("\n");
}

module.exports = { formatReport };
