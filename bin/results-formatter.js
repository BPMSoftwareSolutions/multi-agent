// warehouse:file
// responsibility: Formats and persists taxonomy report output with statistics and coverage display
// actor: results_formatter
// role: output_writer
// source_truth: implementation

const path = require("path");
const fs = require("fs");

// warehouse:method
// responsibility: Extracts top N entries sorted by value for coverage analysis
// actor: method_implementation
// role: implementation
// source_truth: implementation
function topN(obj, n) {
  return Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n);
}

// warehouse:method
// responsibility: Writes report to file and renders human-readable summary or JSON output
// actor: method_implementation
// role: implementation
// source_truth: implementation
function outputReport(report, outputPath, jsonOutput) {
  if (outputPath) {
    const out = path.resolve(outputPath);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(report, null, 2), "utf8");
  }

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  const s = report.summary;
  console.log(`Taxonomy report — ${report.repo_root}`);
  console.log(`  generated: ${report.generated_at}`);
  console.log(`  python files:        ${s.total_python}`);
  console.log(`  fully trustworthy:   ${s.fully_trustworthy_files}`);
  console.log(`  file anchors:        ${s.file_anchor.trustworthy} trustworthy, ${s.file_anchor.low_quality} low-quality, ${s.file_anchor.missing} missing`);
  console.log(`  method coverage:     ${s.methods.trustworthy}/${s.methods.total} methods trustworthy`);
  console.log(`  roles (trustworthy file anchors):`);
  for (const [role, count] of topN(s.by_role, 12)) console.log(`    ${String(count).padStart(5)}  ${role}`);
  if (outputPath) console.log(`\n  written: ${path.resolve(outputPath)}`);
}

module.exports = { topN, outputReport };
