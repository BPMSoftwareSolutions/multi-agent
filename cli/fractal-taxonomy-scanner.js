// warehouse:file
// responsibility: Orchestrates self first taxonomy coherence scan by extracting warehouse anchors evaluating claim evidence alignment writing live run status markdown observability and reporting scale readiness
// actor: fractal_taxonomy_scanner
// role: taxonomy_scanner
// source_truth: implementation

const fs = require("fs");
const path = require("path");
const { walk } = require("../src/audit/file-scanner");
const { extractFromFile } = require("../src/taxonomy/extractor");
const { generateReport } = require("../src/taxonomy/report-generator");
const { evaluateFileCoherence } = require("../src/story-analysis/coherence-evaluator");

// warehouse:method
// responsibility: Orchestrates self first taxonomy coherence scan by extracting warehouse anchors evaluating claim evidence alignment writing live run status markdown observability and reporting scale readiness
// actor: method_implementation
// role: implementation
// source_truth: implementation
function rel(root, filePath) {
  return path.relative(root, filePath).replace(/\\/g, "/") || ".";
}

// warehouse:method
// responsibility: Orchestrates self first taxonomy coherence scan by extracting warehouse anchors evaluating claim evidence alignment writing live run status markdown observability and reporting scale readiness
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatCurrentRunMarkdown(status) {
  const totals = status.totals || {};
  const lines = [
    "# Fractal Taxonomy Run",
    "",
    `Status: ${String(status.state || "unknown").toUpperCase()}`,
    "",
    `Run: ${status.run_id}`,
    `Mode: ${status.mode}`,
    `Self score: ${status.self ? status.self.score : "n/a"}/100`,
    `Target files: ${totals.target_files || 0}`,
    `Completed files: ${totals.completed_files || 0}`,
    `Current file: ${status.current_file || "(none)"}`,
    `Last completed: ${status.last_completed || "(none)"}`,
  ];

  if (typeof totals.overall_coherence === "number") {
    lines.push(`Overall coherence: ${totals.overall_coherence}/100`);
  }
  if (typeof totals.weak_files === "number") {
    lines.push(`Weak files: ${totals.weak_files}`);
  }
  if (typeof totals.under_70_files === "number") {
    lines.push(`Under 70: ${totals.under_70_files}`);
  }

  lines.push("", `Report: ${status.report}`, "");
  return lines.join("\n");
}

// warehouse:method
// responsibility: Orchestrates self first taxonomy coherence scan by extracting warehouse anchors evaluating claim evidence alignment writing live run status markdown observability and reporting scale readiness
// actor: method_implementation
// role: implementation
// source_truth: implementation
function writeRunObservability({ root, reportsDir, runDir, outputPath, status, manifest, part }) {
  const updatedAt = new Date().toISOString();
  const nextStatus = { ...status, updated_at: updatedAt };
  const nextManifest = { ...manifest, state: nextStatus.state, updated_at: updatedAt };

  fs.writeFileSync(path.join(runDir, "manifest.json"), JSON.stringify(nextManifest, null, 2), "utf8");
  fs.writeFileSync(path.join(runDir, "status.json"), JSON.stringify(nextStatus, null, 2), "utf8");
  fs.writeFileSync(path.join(reportsDir, "fractal-status-latest.json"), JSON.stringify(nextStatus, null, 2), "utf8");
  fs.writeFileSync(path.join(reportsDir, "CURRENT-RUN.md"), formatCurrentRunMarkdown(nextStatus), "utf8");

  if (part) {
    fs.writeFileSync(path.join(runDir, "part-p1-0000.json"), JSON.stringify({ ...part, ts: updatedAt }, null, 2), "utf8");
  }

  return {
    manifest: nextManifest,
    status: nextStatus,
    reportPath: rel(root, outputPath),
  };
}

// warehouse:method
// responsibility: Orchestrates self first taxonomy coherence scan by extracting warehouse anchors evaluating claim evidence alignment writing live run status markdown observability and reporting scale readiness
// actor: method_implementation
// role: implementation
// source_truth: implementation
function readLatestStatus(root, json) {
  const statusPath = path.join(root, "reports", "fractal-status-latest.json");
  const markdownPath = path.join(root, "reports", "CURRENT-RUN.md");
  if (!fs.existsSync(statusPath)) {
    console.log("No fractal taxonomy status found. Run: npm run fractal-scan");
    return 1;
  }
  if (json) {
    console.log(fs.readFileSync(statusPath, "utf8"));
  } else if (fs.existsSync(markdownPath)) {
    console.log(fs.readFileSync(markdownPath, "utf8"));
  } else {
    const status = JSON.parse(fs.readFileSync(statusPath, "utf8"));
    console.log(formatCurrentRunMarkdown(status));
  }
  return 0;
}

// warehouse:method
// responsibility: Orchestrates self first taxonomy coherence scan by extracting warehouse anchors evaluating claim evidence alignment writing live run status markdown observability and reporting scale readiness
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function runFractalTaxonomyScan() {
  const root = path.resolve(__dirname, "..");
  const args = process.argv.slice(2);
  const json = args.includes("--json");
  const selfOnly = args.includes("--self-only");
  const statusOnly = args.includes("--status");
  if (statusOnly) {
    return readLatestStatus(root, json);
  }

  const targetIndex = args.indexOf("--target");
  const explicitTarget = targetIndex >= 0 ? args[targetIndex + 1] : null;
  const targetPaths = explicitTarget
    ? [path.resolve(root, explicitTarget)]
    : [path.join(root, "bin"), path.join(root, "src")];
  const reportsDir = path.join(root, "reports");
  const outputPath = path.join(reportsDir, "fractal-taxonomy-experiment.json");
  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const runDir = path.join(reportsDir, "fractal-runs", runId);
  const selfPath = __filename;
  const selfTaxonomy = extractFromFile(selfPath, root);

  if (!selfTaxonomy) {
    throw new Error("Fractal scanner could not extract taxonomy from itself");
  }

  const selfAnalysis = evaluateFileCoherence(selfTaxonomy);
  const selfResult = {
    path: selfTaxonomy.path,
    score: selfAnalysis.coherenceScore,
    aligned_methods: selfAnalysis.alignedMethods,
    total_methods: selfAnalysis.totalMethods,
    issues: selfAnalysis.issues,
  };
  const manifest = {
    schema: "fractal-taxonomy-run.v1",
    run_id: runId,
    state: "running",
    mode: selfOnly ? "self-only" : "scale-out",
    target_paths: targetPaths.map((targetPath) => path.relative(root, targetPath).replace(/\\/g, "/") || "."),
    self: selfResult,
    started_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const baseStatus = {
    schema: "fractal-taxonomy-status.v1",
    run_id: runId,
    state: "starting",
    mode: manifest.mode,
    self: selfResult,
    totals: {
      target_files: 0,
      completed_files: 0,
      weak_files: 0,
      under_70_files: 0,
    },
    current_file: selfTaxonomy.path,
    last_completed: null,
    report: rel(root, outputPath),
    updated_at: manifest.updated_at,
  };
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
  fs.writeFileSync(path.join(reportsDir, "fractal-latest-run.json"), JSON.stringify({ run_id: runId, dir: runDir }, null, 2), "utf8");
  let currentManifest = manifest;
  let currentStatus = baseStatus;
  ({ manifest: currentManifest, status: currentStatus } = writeRunObservability({
    root,
    reportsDir,
    runDir,
    outputPath,
    manifest: currentManifest,
    status: currentStatus,
  }));

  if (selfAnalysis.coherenceScore !== 100) {
    const blockedReport = {
      schema: "fractal-taxonomy-experiment.v1",
      state: "blocked",
      reason: "self_coherence_below_100",
      generated: new Date().toISOString(),
      self: selfResult,
      scaled: null,
    };
    currentStatus = {
      ...currentStatus,
      state: "blocked",
      totals: {
        target_files: 0,
        completed_files: 0,
        weak_files: 0,
        under_70_files: 0,
      },
      current_file: null,
      last_completed: null,
    };
    ({ manifest: currentManifest, status: currentStatus } = writeRunObservability({
      root,
      reportsDir,
      runDir,
      outputPath,
      manifest: currentManifest,
      status: currentStatus,
    }));
    fs.writeFileSync(outputPath, JSON.stringify(blockedReport, null, 2), "utf8");
    if (json) {
      console.log(JSON.stringify(blockedReport, null, 2));
    } else {
      console.log("Fractal taxonomy scanner blocked before scale-out.");
      console.log(`Self score: ${selfAnalysis.coherenceScore}/100`);
      console.log(`Report: ${outputPath}`);
    }
    return 1;
  }

  const allFiles = selfOnly
    ? [selfPath]
    : targetPaths.flatMap((targetPath) => walk(targetPath)).sort();
  let part = {
      pass: 1,
      packet_index: 0,
      state: "running",
      current_file: allFiles.length ? rel(root, allFiles[0]) : null,
      last_completed: null,
      target_files: allFiles.length,
      completed_files: 0,
      results: [],
  };
  currentStatus = {
    ...currentStatus,
    state: "running",
    totals: {
      ...currentStatus.totals,
      target_files: allFiles.length,
      completed_files: 0,
    },
    current_file: part.current_file,
    last_completed: null,
  };
  ({ manifest: currentManifest, status: currentStatus } = writeRunObservability({
    root,
    reportsDir,
    runDir,
    outputPath,
    manifest: currentManifest,
    status: currentStatus,
    part,
  }));

  const extracted = [];
  for (let index = 0; index < allFiles.length; index += 1) {
    const filePath = allFiles[index];
    const currentFile = rel(root, filePath);
    currentStatus = {
      ...currentStatus,
      current_file: currentFile,
      totals: {
        ...currentStatus.totals,
        completed_files: extracted.length,
      },
    };
    part = {
      ...part,
      current_file: currentFile,
      completed_files: extracted.length,
    };
    ({ manifest: currentManifest, status: currentStatus } = writeRunObservability({
      root,
      reportsDir,
      runDir,
      outputPath,
      manifest: currentManifest,
      status: currentStatus,
      part,
    }));

    const taxonomy = extractFromFile(filePath, root);
    if (taxonomy) {
      extracted.push(taxonomy);
      part.results.push({ path: taxonomy.path, status: "extracted" });
    }

    currentStatus = {
      ...currentStatus,
      current_file: index + 1 < allFiles.length ? rel(root, allFiles[index + 1]) : null,
      last_completed: currentFile,
      totals: {
        ...currentStatus.totals,
        completed_files: extracted.length,
      },
    };
    part = {
      ...part,
      current_file: currentStatus.current_file,
      last_completed: currentFile,
      completed_files: extracted.length,
    };
    ({ manifest: currentManifest, status: currentStatus } = writeRunObservability({
      root,
      reportsDir,
      runDir,
      outputPath,
      manifest: currentManifest,
      status: currentStatus,
      part,
    }));
  }

  const taxonomyReport = generateReport(extracted);
  const analyses = taxonomyReport.files
    .map((file) => ({
      path: file.path,
      analysis: evaluateFileCoherence(file),
    }))
    .sort((a, b) => a.analysis.coherenceScore - b.analysis.coherenceScore);
  const total = analyses.length;
  const overall = total
    ? Math.round(analyses.reduce((sum, item) => sum + item.analysis.coherenceScore, 0) / total)
    : 0;
  const scaled = {
    target_paths: targetPaths.map((targetPath) => rel(root, targetPath)),
    total_files: total,
    overall_coherence: overall,
    strong_files: analyses.filter((item) => item.analysis.coherenceScore >= 70).length,
    weak_files: analyses.filter((item) => item.analysis.coherenceScore < 50).length,
    under_70_files: analyses.filter((item) => item.analysis.coherenceScore < 70).length,
    lowest: analyses.slice(0, 20).map((item) => ({
      path: item.path,
      score: item.analysis.coherenceScore,
      file_responsibility: item.analysis.fileResp,
      issues: item.analysis.issues.slice(0, 5),
    })),
  };
  const report = {
    schema: "fractal-taxonomy-experiment.v1",
    state: "scaled",
    generated: new Date().toISOString(),
    self: selfResult,
    scaled,
  };
  const status = {
    schema: "fractal-taxonomy-status.v1",
    run_id: runId,
    state: "done",
    mode: manifest.mode,
    self: selfResult,
    totals: {
      target_files: scaled.total_files,
      completed_files: scaled.total_files,
      overall_coherence: scaled.overall_coherence,
      weak_files: scaled.weak_files,
      under_70_files: scaled.under_70_files,
    },
    current_file: null,
    last_completed: analyses.length ? analyses[analyses.length - 1].path : null,
    report: rel(root, outputPath),
    updated_at: new Date().toISOString(),
  };

  part = {
      ...part,
      state: "done",
      current_file: null,
      last_completed: status.last_completed,
      target_files: scaled.total_files,
      completed_files: scaled.total_files,
      lowest: scaled.lowest,
  };
  ({ manifest: currentManifest, status: currentStatus } = writeRunObservability({
    root,
    reportsDir,
    runDir,
    outputPath,
    manifest: currentManifest,
    status,
    part,
  }));
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), "utf8");

  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log("Fractal taxonomy scanner self-check passed.");
    console.log(`Self score: ${selfAnalysis.coherenceScore}/100`);
    if (!selfOnly) {
      console.log(`Scaled target files: ${scaled.total_files}`);
      console.log(`Overall coherence: ${scaled.overall_coherence}/100`);
      console.log(`Weak files: ${scaled.weak_files}`);
      console.log(`Under 70: ${scaled.under_70_files}`);
    }
    console.log(`Report: ${outputPath}`);
  }

  return 0;
}

if (require.main === module) {
  runFractalTaxonomyScan()
    .then((code) => process.exit(code))
    .catch((error) => {
      console.error(`Fractal taxonomy scanner failed: ${error.message}`);
      process.exit(2);
    });
}

module.exports = { runFractalTaxonomyScan };
