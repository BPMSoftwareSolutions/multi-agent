#!/usr/bin/env node
// warehouse:file
// responsibility: Runs observable single file taxonomy healing by reporting case generation expected remediation repair evidence and verification status
// actor: taxonomy_heal_runner
// role: orchestrator
// source_truth: implementation

const fs = require("fs");
const path = require("path");
const { buildTaxonomyCaseFile } = require("./taxonomy-case-file");
const { applyExpectedTaxonomy } = require("./taxonomy-heal");
const { buildFileEvidence } = require("./taxonomy-evidence-bundle");

// warehouse:method
// responsibility: Runs observable single file taxonomy healing by reporting case generation expected remediation repair evidence and verification status
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatHealingMarkdown(status) {
  const lines = [
    "# Taxonomy Healing Run",
    "",
    `Status: ${String(status.state).toUpperCase()}`,
    "",
    `Run: ${status.run_id}`,
    `Target file: ${status.target_file}`,
    `Phase: ${status.phase}`,
    `Current action: ${status.current_action}`,
    `Expected taxonomy: ${status.expected_taxonomy || "(pending)"}`,
    `Case directory: ${status.case_dir || "(pending)"}`,
    `Score before: ${typeof status.score_before === "number" ? `${status.score_before}/100` : "(pending)"}`,
    `Score after: ${typeof status.score_after === "number" ? `${status.score_after}/100` : "(pending)"}`,
    `Evidence trustworthy: ${typeof status.evidence_trustworthy === "boolean" ? (status.evidence_trustworthy ? "yes" : "no") : "(pending)"}`,
    "",
  ];
  return lines.join("\n");
}

// warehouse:method
// responsibility: Runs observable single file taxonomy healing by reporting case generation expected remediation repair evidence and verification status
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
// responsibility: Runs observable single file taxonomy healing by reporting case generation expected remediation repair evidence and verification status
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
// responsibility: Runs observable single file taxonomy healing by reporting case generation expected remediation repair evidence and verification status
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
  writeHealingStatus,
  runObservableTaxonomyHeal,
  runTaxonomyHealRun,
};
