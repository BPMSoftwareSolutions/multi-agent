const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { loadDeliveryManifest } = require("../src/delivery/manifest-loader");
const { buildDeliveryReadiness } = require("../src/delivery/release-readiness");

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function makeTempRepo() {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "loc-delivery-"));
  const reportsDir = path.join(rootDir, "reports");
  fs.mkdirSync(reportsDir, { recursive: true });
  writeJson(path.join(reportsDir, "scan-report-latest.json"), {
    schema: "taxonomy-coherence-scan-report.v1",
    run_id: "scan-temp-001",
    summary: {
      files_scanned: 1,
      file_anchors_found: 1,
      method_anchors_found: 1,
      detected_methods: 1,
      folder_coherence: 100,
      strong_count: 1,
      weak_count: 0,
      missing_count: 0,
    },
  });
  writeJson(path.join(reportsDir, "codebase-story-review-latest.json"), {
    report_id: "story-temp-001",
    summary: {
      files_reviewed: 1,
      trusted_stories: 1,
      weak_stories: 0,
      missing_taxonomy: 0,
      method_anchors_found: 1,
      method_anchors_expected: 1,
      local_taxonomy_tie_out: 100,
    },
    headline_verdict: "coherence earned",
    story_governance: {
      status: "earned",
      canonical_residue_gate: "pass",
      overall_story_coherence: "100/100 earned",
    },
    file_economy: {
      status: "pass",
      signals: {
        small_boundary_reviewed_count: 1,
        small_boundary_unearned_count: 0,
        consolidation_candidate_count: 0,
      },
    },
    filesystem_story: {
      status: "pass",
      score: 100,
      path_language_issues: 0,
    },
    readme_alignment: {
      status: "pass",
      source_truth: "projection-ready from current scan and story review",
      stale_count: 0,
    },
    legacy_residue: {
      residue_pressure: 0,
      canonical_surface_map: [],
      residue_queue: [],
    },
  });
  writeJson(path.join(reportsDir, "delivery-learning", "delivery-honest-coherence-stabilization.json"), {
    schema: "delivery-learning-record.v1",
    delivery_id: "delivery-honest-coherence-stabilization",
    story_id: "STORY-HONEST-COHERENCE-001",
    lessons: [
      "Acceptance evidence must be declared before release readiness can be earned.",
    ],
    future_regressions: [
      "copied responsibilities must not be treated as coherent",
    ],
  });
  fs.writeFileSync(path.join(rootDir, "README.md"), [
    "<!--",
    "generated_from:",
    "  source_scan: scan-temp-001",
    "  source_story_review: story-temp-001",
    "-->",
    "# Temp README",
    "",
  ].join("\n"), "utf8");
  fs.mkdirSync(path.join(rootDir, "src", "story-analysis"), { recursive: true });
  fs.mkdirSync(path.join(rootDir, "src", "observability"), { recursive: true });
  fs.writeFileSync(path.join(rootDir, "src", "story-analysis", "coherence-evaluator.js"), "module.exports = {};\n", "utf8");
  fs.writeFileSync(path.join(rootDir, "src", "observability", "taxonomy-scan-report.js"), "module.exports = {};\n", "utf8");
  return { rootDir, reportsDir };
}

const fixtureManifest = loadDeliveryManifest(path.join("tests", "fixtures", "delivery", "honest-coherence.manifest.json"), {
  baseDir: path.resolve(__dirname, ".."),
});

const repo = makeTempRepo();
const result = buildDeliveryReadiness({
  manifest: fixtureManifest,
  rootDir: repo.rootDir,
  reportsDir: repo.reportsDir,
  writeReports: true,
});

assert.strictEqual(result.readiness.schema, "loc-delivery-readiness-report.v1");
assert.strictEqual(result.readiness.delivery_id, "delivery-honest-coherence-stabilization");
assert.strictEqual(result.readiness.intent.story_id, "STORY-HONEST-COHERENCE-001");
assert.strictEqual(result.readiness.acceptance.status, "declared_not_executed");
assert.strictEqual(result.readiness.acceptance.scenario_count, 2);
assert.strictEqual(result.readiness.implementation_trace.status, "pass");
assert.ok(result.readiness.coherence);
assert.ok(result.readiness.learning);
assert.strictEqual(result.readiness.status, "release_blocked");
assert.ok(result.readiness.blocking_gates.includes("acceptance"));

const writtenJson = path.join(repo.reportsDir, "delivery-readiness", "delivery-honest-coherence-stabilization", "readiness.json");
const writtenMd = path.join(repo.reportsDir, "delivery-readiness", "delivery-honest-coherence-stabilization", "readiness.md");
assert(fs.existsSync(writtenJson), "expected readiness.json to be written");
assert(fs.existsSync(writtenMd), "expected readiness.md to be written");
assert(fs.existsSync(path.join(repo.reportsDir, "delivery-readiness", "latest.json")), "expected latest.json to be written");
assert(fs.existsSync(path.join(repo.rootDir, "reports", "DELIVERY-READINESS-LATEST.md")), "expected latest markdown to be written");

const json = JSON.parse(fs.readFileSync(writtenJson, "utf8"));
assert.strictEqual(json.delivery_id, "delivery-honest-coherence-stabilization");
assert.strictEqual(json.status, "release_blocked");
assert.strictEqual(json.story_check.status, "story_coherence_earned");

const badEvidenceManifest = JSON.parse(JSON.stringify(fixtureManifest));
badEvidenceManifest.acceptance.scenarios = [
  {
    id: "SCN-HC-001",
    name: "copied method responsibility lowers coherence",
    evidence: "reports/missing-evidence.json",
  },
];
badEvidenceManifest.implementation.changed_files = [
  {
    path: "src/does-not-exist.js",
    reason: "nonexistent file should not be trusted",
    value_link: "STORY-HONEST-COHERENCE-001",
    acceptance_links: ["SCN-HC-001"],
  },
];
const badResult = buildDeliveryReadiness({
  manifest: badEvidenceManifest,
  rootDir: repo.rootDir,
  reportsDir: repo.reportsDir,
  writeReports: false,
});
assert.notStrictEqual(badResult.readiness.status, "release_ready");
assert.ok(badResult.readiness.blocking_gates.includes("acceptance"));
assert.ok(badResult.readiness.blocking_gates.includes("implementation_trace"));
assert.strictEqual(badResult.readiness.acceptance.status, "review_required");
assert.strictEqual(badResult.readiness.implementation_trace.status, "blocked");
assert.strictEqual(badResult.readiness.implementation_trace.changed_files[0].exists, false);

console.log("LOC delivery readiness report verification passed.");
