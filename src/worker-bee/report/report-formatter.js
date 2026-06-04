// warehouse:file
// responsibility: undefined — formatReport
// actor: method_implementation
// role: implementation
// source_truth: implementation

// warehouse:method
// responsibility: undefined — formatReport
// actor: method_implementation
// role: implementation
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
