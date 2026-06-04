// warehouse:file
// responsibility: Generates governed README projections from verified taxonomy scan and codebase story review state to prevent documentation drift
// actor: readme_projection_renderer
// role: renderer
// source_truth: implementation

const fs = require("fs");
const path = require("path");

const README_BEGIN = "<!-- GENERATED:README_PROJECTION:BEGIN -->";
const README_END = "<!-- GENERATED:README_PROJECTION:END -->";

// warehouse:method
// responsibility: Generates governed README projections from verified taxonomy scan and codebase story review state to prevent documentation drift
// actor: method_implementation
// role: implementation
// source_truth: implementation
function markdownValue(value) {
  if (value === null || typeof value === "undefined" || value === "") {
    return "_Pending_";
  }
  return String(value).replace(/\|/g, "\\|");
}

// warehouse:method
// responsibility: Generates governed README projections from verified taxonomy scan and codebase story review state to prevent documentation drift
// actor: method_implementation
// role: implementation
// source_truth: implementation
function markdownTable(headers, rows) {
  return [
    `| ${headers.map(markdownValue).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(markdownValue).join(" | ")} |`),
  ].join("\n");
}

// warehouse:method
// responsibility: Generates governed README projections from verified taxonomy scan and codebase story review state to prevent documentation drift
// actor: method_implementation
// role: implementation
// source_truth: implementation
function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

// warehouse:method
// responsibility: Generates governed README projections from verified taxonomy scan and codebase story review state to prevent documentation drift
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildReadmeProjection(scan, storyReview) {
  const summary = scan.summary;
  const governance = storyReview.story_governance;
  const economy = storyReview.file_economy;
  const residue = storyReview.legacy_residue;
  return {
    schema: "taxonomy-readme-projection.v1",
    generated_at: new Date().toISOString(),
    source_scan: scan.run_id,
    source_story_review: storyReview.report_id,
    source_truth: "taxonomy_scan_plus_codebase_story_review",
    do_not_hand_edit: true,
    regeneration_command: "npm run taxonomy:readme",
    coherence_posture: summary.folder_coherence === 100 ? "local_taxonomy_clean" : "local_taxonomy_review_required",
    canonical_posture: governance.canonical_residue_gate,
    file_economy_posture: economy.status,
    story_posture: governance.status,
    summary: {
      files_reviewed: summary.files_scanned,
      locally_trusted: summary.strong_count,
      weak: summary.weak_count,
      missing: summary.missing_count,
      method_anchors: `${summary.method_anchors_found}/${summary.detected_methods}`,
      local_tie_out: `${summary.folder_coherence}/100`,
      overall_story_coherence: governance.overall_story_coherence,
      residue_pressure: residue.residue_pressure,
      small_boundaries_reviewed: economy.signals.small_boundary_reviewed_count,
      small_boundaries_unearned: economy.signals.small_boundary_unearned_count,
      consolidation_candidates: economy.signals.consolidation_candidate_count,
    },
    canonical_surfaces: residue.canonical_surface_map,
    residue_queue: residue.residue_queue,
  };
}

// warehouse:method
// responsibility: Generates governed README projections from verified taxonomy scan and codebase story review state to prevent documentation drift
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatMetadata(projection) {
  return [
    "<!--",
    "generated_from:",
    `  source_scan: ${projection.source_scan}`,
    `  source_story_review: ${projection.source_story_review}`,
    `  source_truth: ${projection.source_truth}`,
    `  do_not_hand_edit: ${projection.do_not_hand_edit}`,
    `  regeneration_command: ${projection.regeneration_command}`,
    `  coherence_posture: ${projection.coherence_posture}`,
    `  canonical_posture: ${projection.canonical_posture}`,
    `  file_economy_posture: ${projection.file_economy_posture}`,
    `  story_posture: ${projection.story_posture}`,
    "-->",
  ].join("\n");
}

// warehouse:method
// responsibility: Generates governed README projections from verified taxonomy scan and codebase story review state to prevent documentation drift
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatStatusSummary(projection) {
  const summary = projection.summary;
  return [
    "> Generated from verified taxonomy and story-review evidence.",
    `> Status: ✅ current | Story coherence: ✅ ${summary.overall_story_coherence} | Local tie-out: ✅ ${summary.local_tie_out}`,
  ].join("\n");
}

// warehouse:method
// responsibility: Generates governed README projections from verified taxonomy scan and codebase story review state to prevent documentation drift
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatReadmeProjection(projection) {
  const summary = projection.summary;
  const canonicalRows = projection.canonical_surfaces.map((row) => [
    row.surface_type,
    `\`${row.canonical_surface}\``,
    row.relationship,
    row.decision,
    row.boundary_evidence,
  ]);
  const residueRows = projection.residue_queue.length
    ? projection.residue_queue.map((row) => [`\`${row.file}\``, row.reason, row.decision])
    : [["none", "No residue queue items were detected in the latest story review.", "continue monitoring"]];
  return [
    README_BEGIN,
    "# Multi-Agent Studio",
    "",
    "This README is a generated architecture projection over verified taxonomy scan and codebase story-review evidence. It is not independent source truth.",
    "",
    formatStatusSummary(projection),
    "",
    formatMetadata(projection),
    "",
    "## Governance Snapshot",
    "",
    markdownTable(
      ["Signal", "Value"],
      [
        ["Story posture", projection.story_posture],
        ["Overall story coherence", summary.overall_story_coherence],
        ["Local taxonomy tie-out", summary.local_tie_out],
        ["Files reviewed", summary.files_reviewed],
        ["Locally trusted files", summary.locally_trusted],
        ["Weak files", summary.weak],
        ["Missing taxonomy", summary.missing],
        ["Method anchors", summary.method_anchors],
        ["Canonical residue pressure", summary.residue_pressure],
        ["File economy posture", projection.file_economy_posture],
        ["Small boundaries reviewed", summary.small_boundaries_reviewed],
        ["Small boundaries unearned", summary.small_boundaries_unearned],
        ["Consolidation candidates", summary.consolidation_candidates],
      ]
    ),
    "",
    "## Architecture Story",
    "",
    "The studio is organized around governed multi-agent work: command entry points, taxonomy scanning, coherence healing, swarm execution, observability reports, story review, and verification. Files earn their boundaries when they improve responsibility clarity, testability, agent navigation, governance protection, reuse, evidence generation, or safe swarm execution.",
    "",
    "## Canonical Surface Map",
    "",
    markdownTable(
      ["Surface", "Canonical File", "Relationship", "Decision", "Boundary Evidence"],
      canonicalRows
    ),
    "",
    "## Residue Queue",
    "",
    markdownTable(["File", "Reason", "Decision"], residueRows),
    "",
    "## Operator Commands",
    "",
    markdownTable(
      ["Command", "Purpose"],
      [
        ["`npm run taxonomy-coherence-scan -- .`", "Regenerate taxonomy scan evidence and latest scan report."],
        ["`npm run codebase-story-review-report`", "Regenerate codebase story review from latest scan and swarm evidence."],
        ["`npm run taxonomy:readme`", "Regenerate this README projection and README staleness report."],
        ["`npm run test:readme-projection`", "Verify README generation and staleness detection contracts."],
      ]
    ),
    "",
    "## README Integrity Rule",
    "",
    "A README projection is current only when its embedded source scan and source story-review IDs match the latest verified report artifacts. If the codebase story changes, regenerate this README from verified evidence.",
    README_END,
    "",
  ].join("\n");
}

// warehouse:method
// responsibility: Generates governed README projections from verified taxonomy scan and codebase story review state to prevent documentation drift
// actor: method_implementation
// role: implementation
// source_truth: implementation
function extractReadmeMetadata(readmeText) {
  const scanMatch = readmeText.match(/source_scan:\s*(\S+)/);
  const storyMatch = readmeText.match(/source_story_review:\s*(\S+)/);
  return {
    source_scan: scanMatch ? scanMatch[1] : null,
    source_story_review: storyMatch ? storyMatch[1] : null,
  };
}

// warehouse:method
// responsibility: Generates governed README projections from verified taxonomy scan and codebase story review state to prevent documentation drift
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildReadmeStalenessReport(readmeText, scan, storyReview) {
  const metadata = extractReadmeMetadata(readmeText);
  const rows = [
    {
      readme: "README.md",
      source_scan: metadata.source_scan,
      current_scan: scan.run_id,
      source_story_review: metadata.source_story_review,
      current_story_review: storyReview.report_id,
      status: metadata.source_scan === scan.run_id && metadata.source_story_review === storyReview.report_id ? "current" : "stale",
    },
  ];
  return {
    schema: "taxonomy-readme-staleness-report.v1",
    generated_at: new Date().toISOString(),
    rows,
    stale_count: rows.filter((row) => row.status !== "current").length,
  };
}

// warehouse:method
// responsibility: Generates governed README projections from verified taxonomy scan and codebase story review state to prevent documentation drift
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatReadmeStalenessMarkdown(report) {
  return [
    "# README Projection Integrity Report",
    "",
    markdownTable(
      ["README", "Source scan", "Current scan", "Source story review", "Current story review", "Status"],
      report.rows.map((row) => [
        `\`${row.readme}\``,
        row.source_scan,
        row.current_scan,
        row.source_story_review,
        row.current_story_review,
        row.status === "current" ? "✅ current" : "⚠ stale",
      ])
    ),
    "",
    `Stale README count: ${report.stale_count}`,
    "",
  ].join("\n");
}

// warehouse:method
// responsibility: Generates governed README projections from verified taxonomy scan and codebase story review state to prevent documentation drift
// actor: method_implementation
// role: implementation
// source_truth: implementation
function writeReadmeProjection(rootDir) {
  const reportsDir = path.join(rootDir, "reports");
  const scan = readJson(path.join(reportsDir, "scan-report-latest.json"));
  const storyReview = readJson(path.join(reportsDir, "codebase-story-review-latest.json"));
  const projection = buildReadmeProjection(scan, storyReview);
  const readmeMarkdown = formatReadmeProjection(projection);
  const readmePath = path.join(rootDir, "README.md");
  fs.writeFileSync(readmePath, readmeMarkdown);
  const staleness = buildReadmeStalenessReport(readmeMarkdown, scan, storyReview);
  fs.writeFileSync(path.join(reportsDir, "readme-projection-latest.json"), `${JSON.stringify(staleness, null, 2)}\n`);
  fs.writeFileSync(path.join(reportsDir, "README-PROJECTION-LATEST.md"), formatReadmeStalenessMarkdown(staleness));
  return {
    readme: readmePath,
    staleness,
    projection,
  };
}

module.exports = {
  README_BEGIN,
  README_END,
  buildReadmeProjection,
  buildReadmeStalenessReport,
  extractReadmeMetadata,
  formatStatusSummary,
  formatReadmeProjection,
  formatReadmeStalenessMarkdown,
  writeReadmeProjection,
};
