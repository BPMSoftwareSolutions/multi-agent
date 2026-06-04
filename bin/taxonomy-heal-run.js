// warehouse:file
// responsibility: Runs observable single file taxonomy healing by reporting executive markdown summaries case generation expected remediation repair evidence and verification status
// actor: taxonomy_heal_runner
// role: orchestrator
// source_truth: implementation

const fs = require("fs");
const path = require("path");
const { buildTaxonomyCaseFile } = require("./taxonomy-case-file");
const { applyExpectedTaxonomy } = require("./taxonomy-heal");
const { buildFileEvidence } = require("./taxonomy-evidence-bundle");

// warehouse:method
// responsibility: Runs observable single file taxonomy healing by reporting executive markdown summaries case generation expected remediation repair evidence and verification status
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
// responsibility: Runs observable single file taxonomy healing by reporting executive markdown summaries case generation expected remediation repair evidence and verification status
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
// responsibility: Runs observable single file taxonomy healing by reporting executive markdown summaries case generation expected remediation repair evidence and verification status
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatScore(score) {
  return typeof score === "number" ? `${score}/100` : null;
}

// warehouse:method
// responsibility: Runs observable single file taxonomy healing by reporting executive markdown summaries case generation expected remediation repair evidence and verification status
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatBoolean(value) {
  if (typeof value !== "boolean") {
    return null;
  }
  return value ? "Yes" : "No";
}

// warehouse:method
// responsibility: Runs observable single file taxonomy healing by reporting executive markdown summaries case generation expected remediation repair evidence and verification status
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatScoreDelta(before, after) {
  if (typeof before !== "number" || typeof after !== "number") {
    return null;
  }
  const delta = after - before;
  return delta >= 0 ? `+${delta}` : String(delta);
}

// warehouse:method
// responsibility: Runs observable single file taxonomy healing by reporting executive markdown summaries case generation expected remediation repair evidence and verification status
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatHealingMarkdown(status) {
  const targetMet = typeof status.score_after === "number" ? status.score_after === 100 : null;
  const scopeRows = [
    ["Files in run", "1"],
    ["Files completed", status.phase === "verify" ? "1" : "0"],
    ["Files at 100/100", status.score_after === 100 ? "1" : "0"],
    ["Files requiring model refactor", "0"],
  ];
  const lines = [
    "# Taxonomy Healing Run",
    "",
    "## Executive Summary",
    "",
    markdownTable(
      ["Signal", "Value"],
      [
        ["Status", String(status.state || "unknown").toUpperCase()],
        ["Target file", status.target_file],
        ["Phase", status.phase],
        ["Current action", status.current_action],
        ["Evidence trustworthy", formatBoolean(status.evidence_trustworthy)],
      ]
    ),
    "",
    "## Score Impact",
    "",
    markdownTable(
      ["Before", "After", "Delta", "Target Met"],
      [[formatScore(status.score_before), formatScore(status.score_after), formatScoreDelta(status.score_before, status.score_after), formatBoolean(targetMet)]]
    ),
    "",
    "## Run Scope",
    "",
    markdownTable(["Metric", "Value"], scopeRows),
    "",
    "## Evidence Artifacts",
    "",
    markdownTable(
      ["Artifact", "Path"],
      [
        ["Expected taxonomy", status.expected_taxonomy],
        ["Case directory", status.case_dir],
      ]
    ),
    "",
    "## Run Metadata",
    "",
    markdownTable(
      ["Field", "Value"],
      [
        ["Run ID", status.run_id],
        ["Updated at", status.updated_at],
      ]
    ),
    "",
  ];
  return lines.join("\n");
}

// warehouse:method
// responsibility: Runs observable single file taxonomy healing by reporting executive markdown summaries case generation expected remediation repair evidence and verification status
// actor: method_implementation
// role: implementation
// source_truth: implementation
function writeHealingStatus(reportsDir, runDir, status) {
  const updated = { ...status, updated_at: new Date().toISOString() };
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, "status.json"), JSON.stringify(updated, null, 2), "utf8");
  fs.writeFileSync(path.join(reportsDir, "taxonomy-heal-status-latest.json"), JSON.stringify(updated, null, 2), "utf8");
  fs.writeFileSync(path.join(reportsDir, "CURRENT-RUN.md"), formatHealingMarkdown(updated), "utf8");
  return updated;
}

// warehouse:method
// responsibility: Runs observable single file taxonomy healing by reporting executive markdown summaries case generation expected remediation repair evidence and verification status
// actor: method_implementation
// role: implementation
// source_truth: implementation
function runObservableTaxonomyHeal(filePath, root, reportsDir) {
  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const runDir = path.join(reportsDir, "taxonomy-heal-runs", runId);
  const relFile = path.relative(root, path.resolve(root, filePath)).replace(/\\/g, "/");
  let status = {
    schema: "taxonomy-heal-run-status.v1",
    run_id: runId,
    state: "running",
    target_file: relFile,
    phase: "start",
    current_action: "initializing single-file taxonomy healing run",
    expected_taxonomy: null,
    case_dir: null,
    score_before: null,
    score_after: null,
    evidence_trustworthy: null,
  };

  status = writeHealingStatus(reportsDir, runDir, status);
  status = writeHealingStatus(reportsDir, runDir, {
    ...status,
    phase: "case",
    current_action: "scanning actual taxonomy and producing expected remediation JSON",
  });
  const caseResult = buildTaxonomyCaseFile(relFile, root, path.join(reportsDir, "taxonomy-case-files"));
  const expectedPath = path.join(caseResult.case_dir, "expected-coherence.json");

  status = writeHealingStatus(reportsDir, runDir, {
    ...status,
    phase: "expected",
    current_action: "expected taxonomy JSON generated and selected as repair contract",
    expected_taxonomy: expectedPath,
    case_dir: caseResult.case_dir,
    score_before: caseResult.current_score,
  });

  status = writeHealingStatus(reportsDir, runDir, {
    ...status,
    phase: "heal",
    current_action: "applying expected taxonomy remediation to target file",
  });
  const healResult = applyExpectedTaxonomy(path.join(root, expectedPath), root);

  status = writeHealingStatus(reportsDir, runDir, {
    ...status,
    phase: "evidence",
    current_action: "building post-heal evidence bundle and checking trust",
    score_after: healResult.score,
  });
  const evidence = buildFileEvidence(relFile, root);

  status = writeHealingStatus(reportsDir, runDir, {
    ...status,
    state: evidence.trustworthy && healResult.accepted ? "done" : "failed",
    phase: "verify",
    current_action: "single-file healing run complete",
    evidence_trustworthy: evidence.trustworthy,
  });
  return status;
}

// warehouse:method
// responsibility: Runs observable single file taxonomy healing by reporting executive markdown summaries case generation expected remediation repair evidence and verification status
// actor: method_implementation
// role: implementation
// source_truth: implementation
function runTaxonomyHealRun() {
  const root = path.resolve(__dirname, "..");
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node bin/taxonomy-heal-run.js <file.js>");
    return 1;
  }
  const status = runObservableTaxonomyHeal(file, root, path.join(root, "reports"));
  console.log(`Taxonomy healing run: ${status.state}`);
  console.log(`Target file: ${status.target_file}`);
  console.log(`Score before: ${status.score_before}/100`);
  console.log(`Score after: ${status.score_after}/100`);
  return status.state === "done" ? 0 : 1;
}

if (require.main === module) {
  try {
    process.exit(runTaxonomyHealRun());
  } catch (error) {
    console.error(`Taxonomy healing run failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  formatHealingMarkdown,
  markdownTable,
  markdownValue,
  writeHealingStatus,
  runObservableTaxonomyHeal,
  runTaxonomyHealRun,
};
