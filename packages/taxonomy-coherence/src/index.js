// warehouse:file
// responsibility: Exposes read only taxonomy coherence SDK APIs for scanning story review governance verdicts and README projections
// actor: taxonomy_coherence_sdk
// role: sdk_entrypoint
// source_truth: implementation

const fs = require("fs");
const path = require("path");
const {
  buildScanReport,
  formatScanMarkdown,
  scanTargetPath,
  writeScanReport,
} = require("../../../src/observability/taxonomy-scan-report");
const {
  buildReport: buildStoryReport,
  formatMarkdown: formatStoryReviewMarkdown,
  writeCodebaseStoryReviewReport,
} = require("../../../src/observability/codebase-story-review-report");
const {
  buildReadmeProjection,
  buildReadmeStalenessReport,
  formatReadmeProjection,
  formatReadmeStalenessMarkdown,
} = require("../../../src/observability/readme-projection");

// warehouse:method
// responsibility: Exposes read only taxonomy coherence SDK APIs for scanning story review governance verdicts and README projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function timestampId(prefix) {
  return `${prefix}-${new Date().toISOString().replace(/[:.]/g, "-")}`;
}

// warehouse:method
// responsibility: Exposes read only taxonomy coherence SDK APIs for scanning story review governance verdicts and README projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

// warehouse:method
// responsibility: Exposes read only taxonomy coherence SDK APIs for scanning story review governance verdicts and README projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function scanTaxonomy(options = {}) {
  const rootDir = path.resolve(options.rootDir || process.cwd());
  const targetPath = options.targetPath || ".";
  const startedAt = new Date();
  const scanned = scanTargetPath(targetPath, rootDir);
  const completedAt = new Date();
  const report = buildScanReport({
    run_id: options.runId || timestampId("scan"),
    status: "complete",
    target_path: scanned.target_path,
    files: scanned.files,
    started_at: startedAt.toISOString(),
    completed_at: completedAt.toISOString(),
    duration: `${completedAt.getTime() - startedAt.getTime()}ms`,
  });
  const artifacts = options.writeReports
    ? writeScanReport(report, path.resolve(rootDir, options.reportsDir || "reports"))
    : null;
  return {
    report,
    markdown: formatScanMarkdown(report),
    artifacts,
  };
}

// warehouse:method
// responsibility: Exposes read only taxonomy coherence SDK APIs for scanning story review governance verdicts and README projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildCodebaseStoryReview(options = {}) {
  const rootDir = path.resolve(options.rootDir || process.cwd());
  const reportsDir = path.resolve(rootDir, options.reportsDir || "reports");
  const scan = options.scan || readJson(path.join(reportsDir, "scan-report-latest.json"));
  const swarmPath = path.join(reportsDir, "swarm-report-latest.json");
  const swarm = options.swarm || (fs.existsSync(swarmPath) ? readJson(swarmPath) : null);
  const report = buildStoryReport(scan, swarm);
  const artifacts = options.writeReports ? writeCodebaseStoryReviewReport(report, reportsDir) : null;
  return {
    report,
    markdown: formatStoryReviewMarkdown(report),
    artifacts,
    verdict: getGovernanceVerdict(report),
  };
}

// warehouse:method
// responsibility: Exposes read only taxonomy coherence SDK APIs for scanning story review governance verdicts and README projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function getGovernanceVerdict(storyReview) {
  const governance = storyReview.story_governance;
  const economy = storyReview.file_economy;
  const residue = storyReview.legacy_residue;
  return {
    status: governance.status === "earned" ? "story_coherence_earned" : "story_coherence_not_yet_earned",
    localTieOut: {
      score: storyReview.summary.local_taxonomy_tie_out,
      filesTrusted: storyReview.summary.trusted_stories,
      methodsTiedOut: storyReview.summary.method_anchors_found,
    },
    fileEconomy: {
      status: economy.status === "pass" ? "pass" : "review_required",
      score: economy.provisional_score,
      smallBoundariesReviewed: economy.signals.small_boundary_reviewed_count,
      smallBoundariesUnearned: economy.signals.small_boundary_unearned_count,
    },
    residue: {
      status: residue.status === "pass" ? "pass" : "review_required",
      pressure: residue.residue_pressure,
      canonicalSurfaces: residue.canonical_surface_map,
    },
    overall: {
      earned: governance.status === "earned",
      score: governance.status === "earned" ? 100 : null,
      verdict: storyReview.headline_verdict,
    },
  };
}

// warehouse:method
// responsibility: Exposes read only taxonomy coherence SDK APIs for scanning story review governance verdicts and README projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function generateReadmeProjection(options = {}) {
  const rootDir = path.resolve(options.rootDir || process.cwd());
  const reportsDir = path.resolve(rootDir, options.reportsDir || "reports");
  const scan = options.scan || readJson(path.join(reportsDir, "scan-report-latest.json"));
  const storyReview = options.storyReview || readJson(path.join(reportsDir, "codebase-story-review-latest.json"));
  const projection = buildReadmeProjection(scan, storyReview);
  const markdown = formatReadmeProjection(projection);
  const staleness = buildReadmeStalenessReport(markdown, scan, storyReview);
  if (options.out) {
    fs.writeFileSync(path.resolve(rootDir, options.out), markdown, "utf8");
  }
  return {
    targetPath: options.out || "README.md",
    sourceScanId: projection.source_scan,
    sourceStoryReviewId: projection.source_story_review,
    status: projection.story_posture,
    markdown,
    stale: staleness.stale_count > 0,
    staleness,
    stalenessMarkdown: formatReadmeStalenessMarkdown(staleness),
  };
}

module.exports = {
  buildCodebaseStoryReview,
  formatReadmeProjection,
  formatScanMarkdown,
  formatStoryReviewMarkdown,
  generateReadmeProjection,
  getGovernanceVerdict,
  scanTaxonomy,
};
