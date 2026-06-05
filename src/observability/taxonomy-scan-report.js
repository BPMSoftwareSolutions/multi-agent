// warehouse:file
// responsibility: Builds read only taxonomy coherence scan reports with folder posture consoles file ledgers findings assurance latest root copies and artifact projections
// actor: taxonomy_scan_report_renderer
// role: renderer
// source_truth: implementation

const fs = require("fs");
const path = require("path");
const { buildFileEvidence } = require("../../cli/taxonomy-evidence-bundle");
const { extractFromFile } = require("../taxonomy/extractor");
const { isValidTaxonomy } = require("../taxonomy/taxonomy-validator");
const { renderProgressBar, renderStatusSignal } = require("./ascii-components");

const SCAN_PROGRESS_CONTRACT = {
  component_key: "taxonomy_scan_coherence_progress",
  component_kind: "ascii.progress",
  contract_version: "ascii_component.v1",
  rendering: {
    width: 24,
    style: "digital_block",
    show_percent: true,
    show_fraction: false,
  },
};

const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".tmp",
  "coverage",
  "dist",
  "node_modules",
  "reports",
]);

const SUPPORTED_SOURCE_EXTENSIONS = new Set([".js", ".py"]);

// warehouse:method
// responsibility: Builds read only taxonomy coherence scan reports with folder posture consoles file ledgers findings assurance latest root copies and artifact projections
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
// responsibility: Builds read only taxonomy coherence scan reports with folder posture consoles file ledgers findings assurance latest root copies and artifact projections
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
// responsibility: Builds read only taxonomy coherence scan reports with folder posture consoles file ledgers findings assurance latest root copies and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function numeric(value, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

// warehouse:method
// responsibility: Builds read only taxonomy coherence scan reports with folder posture consoles file ledgers findings assurance latest root copies and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function statusSignal(status) {
  const normalized = String(status || "complete").toLowerCase();
  if (normalized === "complete" || normalized === "done") {
    return renderStatusSignal("pass", "complete");
  }
  if (normalized === "blocked" || normalized === "failed") {
    return renderStatusSignal("blocked", normalized);
  }
  return renderStatusSignal("warning", normalized);
}

// warehouse:method
// responsibility: Builds read only taxonomy coherence scan reports with folder posture consoles file ledgers findings assurance latest root copies and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function operatorSignal(meaning, label) {
  return renderStatusSignal(meaning, label, {
    contract: {
      rendering: {
        mode: "unicode",
        uppercase_label: false,
      },
    },
  });
}

// warehouse:method
// responsibility: Builds read only taxonomy coherence scan reports with folder posture consoles file ledgers findings assurance latest root copies and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function statusIcon(meaning) {
  return renderStatusSignal(meaning, "", {
    contract: {
      rendering: {
        mode: "unicode",
        uppercase_label: false,
      },
    },
  }).trim();
}

// warehouse:method
// responsibility: Builds read only taxonomy coherence scan reports with folder posture consoles file ledgers findings assurance latest root copies and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function progressBar(value) {
  return renderProgressBar({
    value,
    max: 100,
    contract: SCAN_PROGRESS_CONTRACT,
  });
}

// warehouse:method
// responsibility: Builds read only taxonomy coherence scan reports with folder posture consoles file ledgers findings assurance latest root copies and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function scoreBand(file) {
  if (file.verdict === "missing_taxonomy") {
    return "missing";
  }
  if (file.verdict === "false_taxonomy") {
    return "false";
  }
  if (file.score >= 80) {
    return "strong";
  }
  if (file.score >= 50) {
    return "moderate";
  }
  if (file.score > 0) {
    return "weak";
  }
  // Present anchor that earns nothing is false taxonomy, not missing taxonomy.
  return file.file_anchor_found ? "false" : "missing";
}

// warehouse:method
// responsibility: Builds read only taxonomy coherence scan reports with folder posture consoles file ledgers findings assurance latest root copies and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function classifyVerdict(file) {
  if (!file.file_anchor_found) {
    return "missing_taxonomy";
  }
  if (file.score === 0) {
    // Anchor is present but earns no coherence (e.g. copied responsibilities).
    // This is false taxonomy, distinct from missing taxonomy.
    return "false_taxonomy";
  }
  if (file.score >= 80) {
    return "trusted_story";
  }
  if (file.score >= 50) {
    return "mostly_aligned";
  }
  return "weak_story";
}

// warehouse:method
// responsibility: Builds read only taxonomy coherence scan reports with folder posture consoles file ledgers findings assurance latest root copies and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function nextActionFor(file) {
  if (file.verdict === "trusted_story") {
    return "none";
  }
  if (file.verdict === "mostly_aligned") {
    return file.scorer_review ? "review semantic tie-out before mutation" : "optional method-anchor review";
  }
  if (file.verdict === "weak_story") {
    return file.scorer_review ? "review semantic tie-out before healing" : "healing recommended";
  }
  if (file.verdict === "false_taxonomy") {
    return "repair copied or false anchors";
  }
  return "add file/method anchors";
}

// warehouse:method
// responsibility: Builds read only taxonomy coherence scan reports with folder posture consoles file ledgers findings assurance latest root copies and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function normalizeFile(file) {
  const normalized = {
    file: file.file || file.path,
    file_anchor_found: file.file_anchor_found === true,
    detected_methods: numeric(file.detected_methods),
    documented_methods: numeric(file.documented_methods),
    score: numeric(file.score),
    scorer_review: file.scorer_review === true,
    file_responsibility: file.file_responsibility || "",
    file_actor: file.file_actor || "",
    file_role: file.file_role || "",
  };
  normalized.verdict = file.verdict || classifyVerdict(normalized);
  normalized.next_action = file.next_action || nextActionFor(normalized);
  normalized.band = scoreBand(normalized);
  return normalized;
}

// warehouse:method
// responsibility: Builds read only taxonomy coherence scan reports with folder posture consoles file ledgers findings assurance latest root copies and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function averageScore(files) {
  if (files.length === 0) {
    return 0;
  }
  return Math.round(files.reduce((sum, file) => sum + file.score, 0) / files.length);
}

// warehouse:method
// responsibility: Builds read only taxonomy coherence scan reports with folder posture consoles file ledgers findings assurance latest root copies and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildSummary(files) {
  return {
    files_scanned: files.length,
    file_anchors_found: files.filter((file) => file.file_anchor_found).length,
    method_anchor_files: files.filter((file) => file.documented_methods > 0).length,
    method_anchors_found: files.reduce((sum, file) => sum + file.documented_methods, 0),
    detected_methods: files.reduce((sum, file) => sum + file.detected_methods, 0),
    folder_coherence: averageScore(files),
    strong_count: files.filter((file) => file.band === "strong").length,
    moderate_count: files.filter((file) => file.band === "moderate").length,
    weak_count: files.filter((file) => file.band === "weak").length,
    false_count: files.filter((file) => file.band === "false").length,
    missing_count: files.filter((file) => file.band === "missing").length,
    scorer_review_count: files.filter((file) => file.scorer_review).length,
    healing_recommended_count: files.filter((file) => file.band === "weak" || file.band === "false" || file.band === "missing").length,
  };
}

// warehouse:method
// responsibility: Builds read only taxonomy coherence scan reports with folder posture consoles file ledgers findings assurance latest root copies and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildFolderStory(targetPath, summary) {
  const coherentCount = summary.strong_count + summary.moderate_count;
  if (summary.files_scanned === 0) {
    return `The scan found no supported source files under ${targetPath}. No taxonomy posture can be established.`;
  }
  if (summary.missing_count === 0 && summary.weak_count === 0) {
    return `The scanned folder appears coherent. ${coherentCount}/${summary.files_scanned} files are moderate or strong, method anchors tie out to file anchors, and no healing is required for this folder snapshot.`;
  }
  return `The scanned folder has ${summary.folder_coherence}/100 folder-level coherence. ${coherentCount}/${summary.files_scanned} files are moderate or strong, while ${summary.weak_count} weak and ${summary.missing_count} missing taxonomy files should be routed before the folder story is treated as trusted.`;
}

// warehouse:method
// responsibility: Builds read only taxonomy coherence scan reports with folder posture consoles file ledgers findings assurance latest root copies and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildFindings(files, summary) {
  const findings = [];
  const weakFiles = files.filter((file) => file.band === "weak");
  const missingFiles = files.filter((file) => file.band === "missing");
  const scorerReviewFiles = files.filter((file) => file.scorer_review);
  const coherentCount = summary.strong_count + summary.moderate_count;

  if (weakFiles.length > 0) {
    const weakest = weakFiles.slice().sort((a, b) => a.score - b.score)[0];
    findings.push({
      priority: findings.length + 1,
      finding: `${weakFiles.length} file(s) have weak file/method tie-out`,
      evidence: `${weakest.file}, ${weakest.score}/100`,
      recommendation: "Run single-file healing",
    });
  }
  if (missingFiles.length > 0) {
    findings.push({
      priority: findings.length + 1,
      finding: `${missingFiles.length} file(s) are missing taxonomy anchors`,
      evidence: missingFiles[0].file,
      recommendation: "Add file and method anchors",
    });
  }
  if (scorerReviewFiles.length > 0) {
    findings.push({
      priority: findings.length + 1,
      finding: `${scorerReviewFiles.length} file(s) may be scorer false negatives`,
      evidence: `${scorerReviewFiles[0].file}, ${scorerReviewFiles[0].score}/100`,
      recommendation: "Review semantic tie-out before mutation",
    });
  }
  findings.push({
    priority: findings.length + 1,
    finding: coherentCount === summary.files_scanned ? "Folder story is coherent" : "Folder story needs follow-up",
    evidence: `${coherentCount}/${summary.files_scanned} files moderate or strong`,
    recommendation: coherentCount === summary.files_scanned ? "Safe to continue monitoring" : "Route weak or missing files to healing",
  });
  return findings;
}

// warehouse:method
// responsibility: Builds read only taxonomy coherence scan reports with folder posture consoles file ledgers findings assurance latest root copies and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildArtifactIndex(runId) {
  const base = `reports/taxonomy-coherence-scans/${runId}`;
  return {
    scan_report_json: `${base}/scan-report.json`,
    scan_report_markdown: `${base}/scan-report.md`,
    file_ledger_json: `${base}/file-ledger.json`,
    finding_ledger_json: `${base}/finding-ledger.json`,
    latest_report_markdown: "reports/SCAN-REPORT-LATEST.md",
    latest_report_json: "reports/scan-report-latest.json",
  };
}

// warehouse:method
// responsibility: Builds read only taxonomy coherence scan reports with folder posture consoles file ledgers findings assurance latest root copies and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildFinalVerdict(summary) {
  if (summary.files_scanned === 0) {
    return "The taxonomy coherence scan completed, but no JavaScript files were found. No source files were mutated.";
  }
  if (summary.weak_count === 0 && summary.missing_count === 0) {
    return "The taxonomy coherence scan completed successfully. All scanned files have trusted taxonomy stories, method anchors tie out to file anchors, and no healing is required.";
  }
  if (summary.folder_coherence >= 70) {
    return `The taxonomy coherence scan completed successfully. The target folder is mostly coherent, with ${summary.folder_coherence}/100 folder-level coherence. No source files were mutated. Weak or missing taxonomy cases were identified and routed for optional healing.`;
  }
  return "The taxonomy coherence scan completed with elevated semantic risk. Multiple files have weak or missing taxonomy, and the folder story should not be treated as trusted until healing or review is completed.";
}

// warehouse:method
// responsibility: Builds read only taxonomy coherence scan reports with folder posture consoles file ledgers findings assurance latest root copies and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildScanReport(input) {
  const files = (input.files || []).map(normalizeFile);
  const summary = buildSummary(files);
  return {
    schema: "taxonomy-coherence-scan-report.v1",
    run_id: input.run_id,
    status: input.status || "complete",
    target_path: input.target_path || ".",
    mode: "read-only",
    started_at: input.started_at || null,
    completed_at: input.completed_at || null,
    duration: input.duration || null,
    generated_at: input.generated_at || new Date().toISOString(),
    summary,
    folder_story: input.folder_story || buildFolderStory(input.target_path || ".", summary),
    file_ledger: files,
    finding_ledger: buildFindings(files, summary),
    read_only_assurance: {
      source_mutation: "none",
      anchor_mutation: "none",
      evidence_mutation: "scan report artifacts only",
      scan_authority: "read-only",
      trust_posture: "advisory",
      healing_performed: "no",
    },
    artifact_index: buildArtifactIndex(input.run_id),
    final_verdict: input.final_verdict || buildFinalVerdict(summary),
  };
}

// warehouse:method
// responsibility: Builds read only taxonomy coherence scan reports with folder posture consoles file ledgers findings assurance latest root copies and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function consoleText(value, width) {
  const text = String(value ?? "_Pending_").replace(/\n/g, " ");
  if (text.length > width) {
    return `${text.slice(0, width - 3)}...`;
  }
  return text.padEnd(width, " ");
}

// warehouse:method
// responsibility: Builds read only taxonomy coherence scan reports with folder posture consoles file ledgers findings assurance latest root copies and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function consoleLine(label, value) {
  return `| ${consoleText(label, 13)} ${consoleText(value, 68)} |`;
}

// warehouse:method
// responsibility: Builds read only taxonomy coherence scan reports with folder posture consoles file ledgers findings assurance latest root copies and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function recommendedNextAction(summary) {
  if (summary.healing_recommended_count === 0) {
    return operatorSignal("evidence", "no healing required");
  }
  return operatorSignal("evidence", `${summary.healing_recommended_count} files recommended for healing`);
}

// warehouse:method
// responsibility: Builds read only taxonomy coherence scan reports with folder posture consoles file ledgers findings assurance latest root copies and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatScanConsole(report) {
  const summary = report.summary;
  const border = "+--------------------------------------------------------------------------------------+";
  return [
    "```text",
    border,
    "| TAXONOMY COHERENCE SCAN                                                              |",
    border,
    consoleLine("Status", statusSignal(report.status)),
    consoleLine("Target", operatorSignal("folder", report.target_path)),
    consoleLine("Mode", renderStatusSignal("scan", "read only")),
    consoleLine(
      "Files",
      `${summary.files_scanned} scanned | ${summary.file_anchors_found} with file anchors | ${summary.method_anchor_files} with method anchors`
    ),
    consoleLine("Coherence", `${summary.folder_coherence}/100  ${progressBar(summary.folder_coherence)}`),
    consoleLine("Strong", `${summary.strong_count} files`),
    consoleLine("Moderate", `${summary.moderate_count} files`),
    consoleLine("Weak", `${summary.weak_count} files`),
    consoleLine("Missing", `${summary.missing_count} files`),
    consoleLine("Mutation", `${statusIcon("locked")} NONE`),
    consoleLine("Next Action", recommendedNextAction(summary)),
    border,
    "```",
  ].join("\n");
}

// warehouse:method
// responsibility: Builds read only taxonomy coherence scan reports with folder posture consoles file ledgers findings assurance latest root copies and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function anchorSignal(value) {
  return value ? statusIcon("pass") : statusIcon("fail");
}

// warehouse:method
// responsibility: Builds read only taxonomy coherence scan reports with folder posture consoles file ledgers findings assurance latest root copies and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatScanMarkdown(report) {
  const summary = report.summary;
  const artifacts = report.artifact_index;
  return [
    "# Taxonomy Coherence Scan Report",
    "",
    formatScanConsole(report),
    "",
    "## Executive Summary",
    "",
    markdownTable(
      ["Signal", "Value"],
      [
        ["Scan status", statusSignal(report.status)],
        ["Target path", `\`${report.target_path}\``],
        ["Scan mode", report.mode],
        ["Files scanned", summary.files_scanned],
        ["File anchors found", `${summary.file_anchors_found}/${summary.files_scanned}`],
        ["Method anchors found", `${summary.method_anchors_found}/${summary.detected_methods}`],
        ["Folder coherence", `${summary.folder_coherence}/100`],
        ["Strong files", summary.strong_count],
        ["Moderate files", summary.moderate_count],
        ["Weak files", summary.weak_count],
        ["Missing taxonomy", summary.missing_count],
        ["Source mutated", renderStatusSignal("locked", "no")],
        ["Recommended next action", recommendedNextAction(summary)],
      ]
    ),
    "",
    "## Coherence Band Summary",
    "",
    markdownTable(
      ["Band", "Count", "Meaning"],
      [
        ["✅ Strong, 80-100", summary.strong_count, "File story and method behavior tie out"],
        ["⚠ Moderate, 50-79", summary.moderate_count, "Mostly coherent, but some ambiguity"],
        ["❌ Weak, 1-49", summary.weak_count, "File anchor and method behavior do not fully agree"],
        ["🚫 Missing, 0 / no anchor", summary.missing_count, "Taxonomy is incomplete or absent"],
        ["🧠 Scorer review", summary.scorer_review_count, "Possible low-vocabulary-overlap false negative"],
      ]
    ),
    "",
    "## Folder Story",
    "",
    report.folder_story,
    "",
    "## File Coherence Ledger",
    "",
    markdownTable(
      ["File", "File Anchor", "Method Anchors", "Score", "Verdict", "Next Action"],
      report.file_ledger.map((file) => [
        `\`${file.file}\``,
        anchorSignal(file.file_anchor_found),
        `${file.documented_methods}/${file.detected_methods}`,
        file.score,
        file.verdict,
        file.next_action,
      ])
    ),
    "",
    "## Top Findings",
    "",
    markdownTable(
      ["Priority", "Finding", "Evidence", "Recommendation"],
      report.finding_ledger.map((finding) => [
        finding.priority,
        finding.finding,
        finding.evidence,
        finding.recommendation,
      ])
    ),
    "",
    "## Read-Only Assurance",
    "",
    markdownTable(
      ["Boundary", "Result"],
      [
        ["Source mutation", "🔒 NONE"],
        ["Anchor mutation", "🔒 NONE"],
        ["Evidence mutation", report.read_only_assurance.evidence_mutation],
        ["Scan authority", report.read_only_assurance.scan_authority],
        ["Trust posture", report.read_only_assurance.trust_posture],
        ["Healing performed", report.read_only_assurance.healing_performed],
      ]
    ),
    "",
    "## Evidence Artifacts",
    "",
    markdownTable(
      ["Artifact", "Path"],
      [
        ["Scan JSON", artifacts.scan_report_json],
        ["Scan markdown", artifacts.scan_report_markdown],
        ["File ledger", artifacts.file_ledger_json],
        ["Finding ledger", artifacts.finding_ledger_json],
        ["Latest scan markdown", artifacts.latest_report_markdown],
        ["Latest scan JSON", artifacts.latest_report_json],
      ]
    ),
    "",
    "## Final Verdict",
    "",
    report.final_verdict,
    "",
    "## Run Metadata",
    "",
    markdownTable(
      ["Field", "Value"],
      [
        ["Run ID", report.run_id],
        ["Started at", report.started_at],
        ["Completed at", report.completed_at],
        ["Duration", report.duration],
        ["Generated at", report.generated_at],
      ]
    ),
  ].join("\n");
}

// warehouse:method
// responsibility: Builds read only taxonomy coherence scan reports with folder posture consoles file ledgers findings assurance latest root copies and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function discoverJavaScriptFiles(targetPath) {
  const discovered = [];
  const stat = fs.statSync(targetPath);
  if (stat.isFile()) {
    return SUPPORTED_SOURCE_EXTENSIONS.has(path.extname(targetPath)) ? [targetPath] : [];
  }
  const entries = fs.readdirSync(targetPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) {
      continue;
    }
    const childPath = path.join(targetPath, entry.name);
    if (entry.isDirectory()) {
      discovered.push(...discoverJavaScriptFiles(childPath));
    } else if (entry.isFile() && SUPPORTED_SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      discovered.push(childPath);
    }
  }
  return discovered.sort((a, b) => a.localeCompare(b));
}

// warehouse:method
// responsibility: Builds read only taxonomy coherence scan reports with folder posture consoles file ledgers findings assurance latest root copies and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
// A responsibility describes ONE concern. Two clauses joined by " and " where the
// second starts a new capitalized phrase signals a merged, overloaded responsibility.
function isMergedResponsibility(value) {
  return / and [A-Z]/.test(String(value || ""));
}

// Single-responsibility tie-out penalty. A file can score perfect "tie-out" while
// saying nothing per-method, because identical/copied/merged responsibilities tie
// out trivially. This penalizes that false coherence so it shows as needing rework.
function responsibilityIntegrityPenalty(taxonomy) {
  const issues = [];
  if (!taxonomy) return { penalty: 0, issues };
  const fileResp = (taxonomy.file && taxonomy.file.responsibility ? taxonomy.file.responsibility : "").trim();
  const methodResps = (taxonomy.methods || [])
    .map((m) => (m.taxonomy && m.taxonomy.responsibility ? m.taxonomy.responsibility : "").trim())
    .filter(Boolean);

  let penalty = 0;
  if (isMergedResponsibility(fileResp)) { issues.push("file_responsibility_merged"); penalty += 20; }
  if (methodResps.length >= 2) {
    const duplicates = methodResps.length - new Set(methodResps).size;
    if (duplicates > 0) { issues.push(`duplicate_method_responsibility:${duplicates}`); penalty += Math.min(50, duplicates * 15); }
  }
  const copied = methodResps.filter((r) => fileResp && r === fileResp).length;
  if (copied > 0) { issues.push(`method_responsibility_copied_from_file:${copied}`); penalty += Math.min(40, copied * 15); }
  const merged = methodResps.filter(isMergedResponsibility).length;
  if (merged > 0) { issues.push(`merged_method_responsibility:${merged}`); penalty += Math.min(30, merged * 8); }

  return { penalty: Math.min(penalty, 75), issues }; // cap so it lands "weak", not "missing"
}

function scanFile(filePath, root) {
  const relPath = path.relative(root, filePath).replace(/\\/g, "/");
  const taxonomy = extractFromFile(filePath, root);
  const evidence = buildFileEvidence(relPath, root);
  const baseScore = evidence.coherence ? evidence.coherence.score : 0;
  const { penalty, issues } = responsibilityIntegrityPenalty(taxonomy);
  const score = Math.max(0, baseScore - penalty);
  const detectedMethods = evidence.coverage.detected_function_count;
  const documentedMethods = evidence.coverage.documented_method_count;
  return {
    file: relPath,
    file_anchor_found: !!taxonomy && isValidTaxonomy(taxonomy.file),
    file_responsibility: taxonomy && taxonomy.file ? taxonomy.file.responsibility || "" : "",
    file_actor: taxonomy && taxonomy.file ? taxonomy.file.actor || "" : "",
    file_role: taxonomy && taxonomy.file ? taxonomy.file.role || "" : "",
    detected_methods: detectedMethods,
    documented_methods: documentedMethods,
    base_score: baseScore,
    responsibility_penalty: penalty,
    responsibility_issues: issues,
    score,
    scorer_review: score > 0 && score < 50 && documentedMethods === detectedMethods && detectedMethods > 0,
  };
}

// warehouse:method
// responsibility: Builds read only taxonomy coherence scan reports with folder posture consoles file ledgers findings assurance latest root copies and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function scanTargetPath(targetPath, root) {
  const absTarget = path.resolve(root, targetPath);
  const files = discoverJavaScriptFiles(absTarget).map((filePath) => scanFile(filePath, root));
  return {
    target_path: path.relative(root, absTarget).replace(/\\/g, "/") || ".",
    files,
  };
}

// warehouse:method
// responsibility: Builds read only taxonomy coherence scan reports with folder posture consoles file ledgers findings assurance latest root copies and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}

// warehouse:method
// responsibility: Builds read only taxonomy coherence scan reports with folder posture consoles file ledgers findings assurance latest root copies and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function writeScanReport(report, reportsDir) {
  const runDir = path.join(reportsDir, "taxonomy-coherence-scans", report.run_id);
  fs.mkdirSync(runDir, { recursive: true });
  const paths = {
    scan_report_json: path.join(runDir, "scan-report.json"),
    scan_report_markdown: path.join(runDir, "scan-report.md"),
    file_ledger_json: path.join(runDir, "file-ledger.json"),
    finding_ledger_json: path.join(runDir, "finding-ledger.json"),
    latest_report_markdown: path.join(reportsDir, "SCAN-REPORT-LATEST.md"),
    latest_report_json: path.join(reportsDir, "scan-report-latest.json"),
  };
  const markdown = formatScanMarkdown(report);
  writeJson(paths.scan_report_json, report);
  fs.writeFileSync(paths.scan_report_markdown, markdown, "utf8");
  writeJson(paths.file_ledger_json, report.file_ledger);
  writeJson(paths.finding_ledger_json, report.finding_ledger);
  fs.writeFileSync(paths.latest_report_markdown, markdown, "utf8");
  writeJson(paths.latest_report_json, report);
  fs.writeFileSync(path.join(reportsDir, "CURRENT-RUN.md"), markdown, "utf8");
  return paths;
}

module.exports = {
  buildArtifactIndex,
  buildFinalVerdict,
  buildFindings,
  buildFolderStory,
  buildScanReport,
  buildSummary,
  discoverJavaScriptFiles,
  formatScanConsole,
  formatScanMarkdown,
  markdownTable,
  markdownValue,
  normalizeFile,
  scanFile,
  scanTargetPath,
  writeScanReport,
};
