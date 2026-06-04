#!/usr/bin/env node
// warehouse:file
// responsibility: Orchestrates self first taxonomy coherence scan by extracting warehouse anchors evaluating claim evidence alignment and reporting scale readiness
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
// responsibility: Orchestrates self first taxonomy coherence scan by extracting warehouse anchors evaluating claim evidence alignment and reporting scale readiness
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function runFractalTaxonomyScan() {
  const root = path.resolve(__dirname, "..");
  const args = process.argv.slice(2);
  const json = args.includes("--json");
  const selfOnly = args.includes("--self-only");
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
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
  fs.writeFileSync(path.join(reportsDir, "fractal-latest-run.json"), JSON.stringify({ run_id: runId, dir: runDir }, null, 2), "utf8");

  if (selfAnalysis.coherenceScore !== 100) {
    const blockedReport = {
      schema: "fractal-taxonomy-experiment.v1",
      state: "blocked",
      reason: "self_coherence_below_100",
      generated: new Date().toISOString(),
      self: selfResult,
      scaled: null,
    };
    const status = {
      schema: "fractal-taxonomy-status.v1",
      run_id: runId,
      state: "blocked",
      mode: manifest.mode,
      self: selfResult,
      totals: {
        target_files: 0,
        completed_files: 0,
        weak_files: 0,
        under_70_files: 0,
      },
      current_file: null,
      last_completed: null,
      report: path.relative(root, outputPath).replace(/\\/g, "/"),
      updated_at: new Date().toISOString(),
    };
    manifest.state = "blocked";
    manifest.updated_at = status.updated_at;
    fs.writeFileSync(path.join(runDir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
    fs.writeFileSync(path.join(runDir, "status.json"), JSON.stringify(status, null, 2), "utf8");
    fs.writeFileSync(path.join(reportsDir, "fractal-status-latest.json"), JSON.stringify(status, null, 2), "utf8");
    fs.writeFileSync(outputPath, JSON.stringify(blockedReport, null, 2), "utf8");
    fs.writeFileSync(
      path.join(reportsDir, "CURRENT-RUN.md"),
      `# Fractal Taxonomy Run\n\nStatus: BLOCKED\n\nSelf score: ${selfAnalysis.coherenceScore}/100\n\nReport: ${path.relative(root, outputPath).replace(/\\/g, "/")}\n`,
      "utf8"
    );
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
  fs.writeFileSync(
    path.join(runDir, "part-p1-0000.json"),
    JSON.stringify({
      pass: 1,
      packet_index: 0,
      state: "running",
      current_file: allFiles.length ? path.relative(root, allFiles[0]).replace(/\\/g, "/") : null,
      last_completed: null,
      target_files: allFiles.length,
      ts: new Date().toISOString(),
    }, null, 2),
    "utf8"
  );
  const extracted = [];
  for (const filePath of allFiles) {
    const taxonomy = extractFromFile(filePath, root);
    if (taxonomy) extracted.push(taxonomy);
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
    target_paths: targetPaths.map((targetPath) => path.relative(root, targetPath).replace(/\\/g, "/") || "."),
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
    report: path.relative(root, outputPath).replace(/\\/g, "/"),
    updated_at: new Date().toISOString(),
  };

  manifest.state = "done";
  manifest.updated_at = status.updated_at;
  fs.writeFileSync(path.join(runDir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
  fs.writeFileSync(
    path.join(runDir, "part-p1-0000.json"),
    JSON.stringify({
      pass: 1,
      packet_index: 0,
      state: "done",
      current_file: null,
      last_completed: status.last_completed,
      target_files: scaled.total_files,
      completed_files: scaled.total_files,
      ts: status.updated_at,
      lowest: scaled.lowest,
    }, null, 2),
    "utf8"
  );
  fs.writeFileSync(path.join(runDir, "status.json"), JSON.stringify(status, null, 2), "utf8");
  fs.writeFileSync(path.join(reportsDir, "fractal-status-latest.json"), JSON.stringify(status, null, 2), "utf8");
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), "utf8");
  fs.writeFileSync(
    path.join(reportsDir, "CURRENT-RUN.md"),
    [
      "# Fractal Taxonomy Run",
      "",
      "Status: DONE",
      "",
      `Run: ${runId}`,
      `Mode: ${manifest.mode}`,
      `Self score: ${selfAnalysis.coherenceScore}/100`,
      `Target files: ${scaled.total_files}`,
      `Completed files: ${scaled.total_files}`,
      `Overall coherence: ${scaled.overall_coherence}/100`,
      `Weak files: ${scaled.weak_files}`,
      `Under 70: ${scaled.under_70_files}`,
      `Last completed: ${status.last_completed || "(none)"}`,
      "",
      `Report: ${status.report}`,
      "",
    ].join("\n"),
    "utf8"
  );

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
