// warehouse:file
// responsibility: Exposes read only story coherence SDK APIs for scanning review packets README projections and governance verdicts
// actor: story_coherence_sdk
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
// responsibility: Exposes read only story coherence SDK APIs for scanning review packets README projections and governance verdicts
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
// responsibility: Exposes read only story coherence SDK APIs for scanning review packets README projections and governance verdicts
// actor: method_implementation
// role: implementation
// source_truth: implementation
function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

// warehouse:method
// responsibility: Exposes read only story coherence SDK APIs for scanning review packets README projections and governance verdicts
// actor: method_implementation
// role: implementation
// source_truth: implementation
function normalizeTargetPath(targetPath) {
  const normalized = String(targetPath || ".").replace(/\\/g, "/").replace(/^\.\//, "");
  return normalized === "" ? "." : normalized;
}

// warehouse:method
// responsibility: Exposes read only story coherence SDK APIs for scanning review packets README projections and governance verdicts
// actor: method_implementation
// role: implementation
// source_truth: implementation
function loadStoryInputs(options = {}) {
  const rootDir = path.resolve(options.rootDir || process.cwd());
  const reportsDir = path.resolve(rootDir, options.reportsDir || "reports");
  return {
    rootDir,
    reportsDir,
    scan: options.scan || readJson(path.join(reportsDir, "scan-report-latest.json")),
    storyReview: options.storyReview || readJson(path.join(reportsDir, "codebase-story-review-latest.json")),
  };
}

// warehouse:method
// responsibility: Exposes read only story coherence SDK APIs for scanning review packets README projections and governance verdicts
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
// responsibility: Exposes read only story coherence SDK APIs for scanning review packets README projections and governance verdicts
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
// responsibility: Exposes read only story coherence SDK APIs for scanning review packets README projections and governance verdicts
// actor: method_implementation
// role: implementation
// source_truth: implementation
function getGovernanceVerdict(storyReview) {
  const governance = storyReview.story_governance;
  const economy = storyReview.file_economy;
  const filesystem = storyReview.filesystem_story;
  const readme = storyReview.readme_alignment || {
    status: "review required",
    source_truth: "missing README alignment evidence",
    stale_count: 1,
  };
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
    filesystemStory: {
      status: filesystem.status === "pass" ? "pass" : "review_required",
      score: filesystem.score,
      pathLanguageIssues: filesystem.path_language_issues,
      misplacedFiles: filesystem.misplaced_files,
      ambiguousFolders: filesystem.ambiguous_folders,
    },
    readmeAlignment: {
      status: readme.status === "pass" ? "pass" : "review_required",
      sourceTruth: readme.source_truth,
      staleCount: readme.stale_count,
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
// responsibility: Exposes read only story coherence SDK APIs for scanning review packets README projections and governance verdicts
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

// warehouse:method
// responsibility: Exposes read only story coherence SDK APIs for scanning review packets README projections and governance verdicts
// actor: method_implementation
// role: implementation
// source_truth: implementation
function openQuestionsForVerdict(verdict) {
  const questions = [];
  if (verdict.localTieOut.score !== 100) {
    questions.push({
      gate: "local_taxonomy",
      question: "Which file or method anchors fail local taxonomy tie-out?",
      evidence: `localTieOut.score=${verdict.localTieOut.score}`,
    });
  }
  if (verdict.filesystemStory.status !== "pass") {
    questions.push({
      gate: "filesystem_story",
      question: "Which paths, filenames, or folders do not speak the canonical story language?",
      evidence: `pathLanguageIssues=${verdict.filesystemStory.pathLanguageIssues}`,
    });
  }
  if (verdict.readmeAlignment.status !== "pass") {
    questions.push({
      gate: "readme_alignment",
      question: "Which README projection source IDs are stale or missing?",
      evidence: `staleCount=${verdict.readmeAlignment.staleCount}`,
    });
  }
  if (verdict.residue.status !== "pass") {
    questions.push({
      gate: "canonical_residue",
      question: "Which canonical surfaces still carry residue pressure or unclear ownership?",
      evidence: `residuePressure=${verdict.residue.pressure}`,
    });
  }
  if (verdict.fileEconomy.status !== "pass") {
    questions.push({
      gate: "file_economy",
      question: "Which small file boundaries have not earned their separation?",
      evidence: `smallBoundariesUnearned=${verdict.fileEconomy.smallBoundariesUnearned}`,
    });
  }
  return questions;
}

// warehouse:method
// responsibility: Exposes read only story coherence SDK APIs for scanning review packets README projections and governance verdicts
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildStoryReasoningPacket(options = {}) {
  const { scan, storyReview } = loadStoryInputs(options);
  const verdict = getGovernanceVerdict(storyReview);
  const summary = storyReview.summary;
  const residue = storyReview.legacy_residue;
  const packet = {
    schema: "story-coherence-reasoning-packet.v1",
    generated_at: new Date().toISOString(),
    purpose: options.purpose || "loc-governance-review",
    target: storyReview.target_path || scan.target_path || ".",
    status: verdict.status,
    source: {
      scan: scan.run_id,
      story_review: storyReview.report_id,
      truth: "taxonomy_scan_plus_codebase_story_review",
      authority: "advisory packet; LOC governance decides",
    },
    localTieOut: {
      score: verdict.localTieOut.score,
      filesReviewed: summary.files_reviewed,
      filesTrusted: verdict.localTieOut.filesTrusted,
      methodsAnchored: verdict.localTieOut.methodsTiedOut,
      weakStories: summary.weak_stories,
      missingTaxonomy: summary.missing_taxonomy,
    },
    filesystemStory: verdict.filesystemStory,
    readmeAlignment: {
      status: verdict.readmeAlignment.status,
      sourceTruth: verdict.readmeAlignment.sourceTruth,
      staleArtifactCount: verdict.readmeAlignment.staleCount,
    },
    residue: {
      status: verdict.residue.status,
      pressure: verdict.residue.pressure,
      unclearOverlap: residue.unclear_overlap,
      removeCandidates: residue.remove_candidates,
      compatibilityShells: residue.compatibility_shells,
    },
    fileEconomy: verdict.fileEconomy,
    canonicalSurfaces: verdict.residue.canonicalSurfaces,
    openQuestions: openQuestionsForVerdict(verdict),
    aiReviewRules: [
      "Do not invent file evidence.",
      "Cite packet fields by path or key.",
      "If evidence is missing, mark review_required.",
      "Do not recommend mutation unless the packet identifies a concrete failing gate.",
      "Keep local taxonomy truth separate from whole-codebase story truth.",
    ],
    authorityBoundary: {
      package: "observed evidence and projections",
      ai: "advisory interpretation and recommendations",
      loc: "governance decision authority",
    },
  };
  return packet;
}

// warehouse:method
// responsibility: Exposes read only story coherence SDK APIs for scanning review packets README projections and governance verdicts
// actor: method_implementation
// role: implementation
// source_truth: implementation
function writeStoryReasoningPacket(options = {}) {
  const rootDir = path.resolve(options.rootDir || process.cwd());
  const outPath = path.resolve(
    rootDir,
    options.out || path.join(options.reportsDir || "reports", "story-coherence", "latest", "ai-packet.json")
  );
  const packet = buildStoryReasoningPacket({ ...options, rootDir });
  ensureDir(path.dirname(outPath));
  fs.writeFileSync(outPath, `${JSON.stringify(packet, null, 2)}\n`, "utf8");
  return {
    packet,
    outPath,
  };
}

// warehouse:method
// responsibility: Exposes read only story coherence SDK APIs for scanning review packets README projections and governance verdicts
// actor: method_implementation
// role: implementation
// source_truth: implementation
function checkCodebaseStory(options = {}) {
  const { rootDir, scan, storyReview } = loadStoryInputs(options);
  const verdict = getGovernanceVerdict(storyReview);
  const readmePath = path.resolve(rootDir, options.readmePath || "README.md");
  const readmeText = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, "utf8") : "";
  const staleness = readmeText
    ? buildReadmeStalenessReport(readmeText, scan, storyReview)
    : {
      stale_count: 1,
      rows: [{
        readme: path.relative(rootDir, readmePath),
        status: "stale",
        reason: "README projection missing",
      }],
    };
  const earned = verdict.overall.earned && staleness.stale_count === 0;
  return {
    schema: "story-coherence-check.v1",
    status: earned ? "story_coherence_earned" : "story_review_required",
    exitCode: earned ? 0 : 1,
    verdict,
    gates: {
      localTaxonomy: verdict.localTieOut.score === 100 ? "pass" : "review_required",
      filesystemStory: verdict.filesystemStory.status,
      readmeAlignment: staleness.stale_count === 0 ? "pass" : "review_required",
      canonicalResidue: verdict.residue.status,
      fileEconomy: verdict.fileEconomy.status,
    },
    readme: {
      path: path.relative(rootDir, readmePath),
      stale: staleness.stale_count > 0,
      staleCount: staleness.stale_count,
      rows: staleness.rows,
    },
  };
}

// warehouse:method
// responsibility: Exposes read only story coherence SDK APIs for scanning review packets README projections and governance verdicts
// actor: method_implementation
// role: implementation
// source_truth: implementation
function domainGuidanceForPath(targetPath) {
  const target = normalizeTargetPath(targetPath);
  if (target === ".") {
    return {
      role: "Repository root owns generated README projection, package metadata, and top-level governance entry points.",
      guidance: "New files at the root need strong boundary evidence; prefer canonical domain folders.",
    };
  }
  if (target === "src/observability" || target.startsWith("src/observability/")) {
    return {
      role: "Global operator observability, scan reports, story reviews, and projection renderers.",
      guidance: "Global reports belong here; worker-local reporting belongs under src/worker-bee.",
    };
  }
  if (target === "src/worker-bee" || target.startsWith("src/worker-bee/")) {
    return {
      role: "Worker-local execution and worker-local reporting support.",
      guidance: "Do not add global operator reports here; use src/observability for codebase-level projections.",
    };
  }
  if (target === "src/story-analysis" || target.startsWith("src/story-analysis/")) {
    return {
      role: "Story analysis formatters and package-level story interpretation helpers.",
      guidance: "Keep deterministic analysis separate from generated report projection surfaces.",
    };
  }
  if (target === "packages/story-coherence" || target.startsWith("packages/story-coherence/")) {
    return {
      role: "Read-only story coherence SDK, CLI, reasoning packets, and governance verdict APIs.",
      guidance: "Do not add healing mutation or provider-specific AI authority inside this package.",
    };
  }
  if (target === "bin" || target.startsWith("bin/")) {
    return {
      role: "Operator CLI entry points and command orchestration surfaces.",
      guidance: "Keep CLI wrappers thin; durable logic belongs in src or package SDK modules.",
    };
  }
  if (target === "tests" || target.startsWith("tests/")) {
    return {
      role: "Verification contracts for scanner, report, package, and governance behavior.",
      guidance: "Tests should protect evidence contracts and prevent false coherence narratives.",
    };
  }
  return {
    role: "Known canonical boundary was not inferred for this path.",
    guidance: "Before adding files here, define the folder role or move the work under an existing canonical domain.",
  };
}

// warehouse:method
// responsibility: Exposes read only story coherence SDK APIs for scanning review packets README projections and governance verdicts
// actor: method_implementation
// role: implementation
// source_truth: implementation
function explainStoryPath(options = {}) {
  const target = normalizeTargetPath(options.targetPath || ".");
  const { scan, storyReview } = loadStoryInputs(options);
  const fileLedger = scan.file_ledger || [];
  const files = fileLedger
    .filter((row) => target === "." || row.file === target || row.file.startsWith(`${target}/`))
    .map((row) => ({
      file: row.file,
      score: row.score,
      band: row.band,
      methods: row.detected_methods,
      fileAnchorFound: row.file_anchor_found,
    }));
  const guidance = domainGuidanceForPath(target);
  return {
    schema: "story-coherence-path-explanation.v1",
    target,
    role: guidance.role,
    guidance: guidance.guidance,
    filesReviewed: files.length,
    files: files.slice(0, options.limit || 20),
    canonicalSurfaces: (storyReview.legacy_residue.canonical_surface_map || [])
      .filter((row) => row.canonical_surface === target || row.canonical_surface.startsWith(`${target}/`) || target === "."),
    editRules: [
      "Declare file and method taxonomy anchors before claiming coherence.",
      "Keep global observability, worker-local reporting, and package SDK surfaces distinct.",
      "Run story:check or loc-story check after changing story-relevant files.",
      "Treat AI review as advisory evidence; LOC governance makes authority decisions.",
    ],
  };
}

module.exports = {
  buildCodebaseStoryReview,
  buildStoryReasoningPacket,
  checkCodebaseStory,
  explainStoryPath,
  formatReadmeProjection,
  formatScanMarkdown,
  formatStoryReviewMarkdown,
  generateReadmeProjection,
  getGovernanceVerdict,
  scanTaxonomy,
  writeStoryReasoningPacket,
};
