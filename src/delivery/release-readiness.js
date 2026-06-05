const fs = require("fs");
const path = require("path");

const { checkCodebaseStory } = require("../../packages/story-coherence/src");
const { loadDeliveryManifest } = require("./manifest-loader");
const { validateDeliveryManifest } = require("./manifest-validator");
const {
  buildDeliveryReadinessReport,
  writeDeliveryReadinessReport,
} = require("../observability/delivery-readiness-report");

function readJsonIfExists(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function resolveMaybeRelative(rootDir, candidate) {
  if (!candidate) {
    return null;
  }
  return path.isAbsolute(candidate) ? candidate : path.resolve(rootDir, candidate);
}

function loadCurrentEvidence(rootDir, reportsDir) {
  const scanPath = path.join(reportsDir, "scan-report-latest.json");
  const storyReviewPath = path.join(reportsDir, "codebase-story-review-latest.json");
  const readmePath = path.join(rootDir, "README.md");
  return {
    scanPath,
    storyReviewPath,
    readmePath,
    scan: readJsonIfExists(scanPath),
    storyReview: readJsonIfExists(storyReviewPath),
    readmeText: fs.existsSync(readmePath) ? fs.readFileSync(readmePath, "utf8") : "",
  };
}

function buildStoryCheckSnapshot(rootDir, reportsDir, evidence) {
  if (!evidence.scan || !evidence.storyReview || !evidence.readmeText) {
    return null;
  }
  try {
    return checkCodebaseStory({
      rootDir,
      reportsDir,
      scan: evidence.scan,
      storyReview: evidence.storyReview,
      readmePath: path.relative(rootDir, evidence.readmePath),
    });
  } catch (_error) {
    return null;
  }
}

function loadLearningRecord(rootDir, manifest) {
  const recordPath = resolveMaybeRelative(rootDir, manifest.learning?.record_path);
  return {
    recordPath,
    record: readJsonIfExists(recordPath),
  };
}

function buildDeliveryReadiness(options = {}) {
  const rootDir = path.resolve(options.rootDir || process.cwd());
  const reportsDir = path.resolve(rootDir, options.reportsDir || "reports");
  const manifest = loadDeliveryManifest(options.manifest || options.manifestPath, {
    baseDir: options.baseDir || rootDir,
  });
  const validation = validateDeliveryManifest(manifest);
  const evidence = loadCurrentEvidence(rootDir, reportsDir);
  const storyCheck = buildStoryCheckSnapshot(rootDir, reportsDir, evidence);
  const learning = loadLearningRecord(rootDir, manifest);

  const readiness = buildDeliveryReadinessReport({
    manifest,
    validation,
    rootDir,
    reportsDir,
    scan: evidence.scan,
    storyReview: evidence.storyReview,
    readmeText: evidence.readmeText,
    readmePath: evidence.readmePath,
    storyCheck,
    learningRecord: learning.record,
    rootDir,
    scanPath: evidence.scanPath,
    storyReviewPath: evidence.storyReviewPath,
  });

  const artifacts = options.writeReports ? writeDeliveryReadinessReport(rootDir, readiness, { reportsDir }) : null;

  return {
    manifest,
    validation,
    readiness,
    storyCheck,
    artifacts,
  };
}

module.exports = {
  buildDeliveryReadiness,
};
