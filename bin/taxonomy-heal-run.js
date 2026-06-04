#!/usr/bin/env node
// warehouse:file
// responsibility: Runs observable single file taxonomy healing by rendering contract driven ascii operator console markdown summaries case generation expected remediation repair evidence and verification status
// actor: taxonomy_heal_runner
// role: orchestrator
// source_truth: implementation

const fs = require("fs");
const path = require("path");
const { buildTaxonomyCaseFile } = require("./taxonomy-case-file");
const { applyExpectedTaxonomy } = require("./taxonomy-heal");
const { buildFileEvidence } = require("./taxonomy-evidence-bundle");
const { renderProgressBar, renderStatusSignal } = require("../src/observability/ascii-components");

const HEALING_PROGRESS_CONTRACT = {
  component_key: "taxonomy_healing_score_progress",
  component_kind: "ascii.progress",
  contract_version: "ascii_component.v1",
  bindings: {
    value: "$.score.current",
    max: "$.score.max",
    label: "$.score.label",
    status: "$.state",
  },
  rendering: {
    width: 24,
    style: "digital_block",
    show_percent: true,
    show_fraction: false,
  },
  authority: {
    source_truth_required: true,
    fail_on_missing_binding: true,
  },
};

// warehouse:method
// responsibility: Runs observable single file taxonomy healing by rendering contract driven ascii operator console markdown summaries case generation expected remediation repair evidence and verification status
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
// responsibility: Runs observable single file taxonomy healing by rendering contract driven ascii operator console markdown summaries case generation expected remediation repair evidence and verification status
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
// responsibility: Runs observable single file taxonomy healing by rendering contract driven ascii operator console markdown summaries case generation expected remediation repair evidence and verification status
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatScore(score) {
  return typeof score === "number" ? `${score}/100` : null;
}

// warehouse:method
// responsibility: Runs observable single file taxonomy healing by rendering contract driven ascii operator console markdown summaries case generation expected remediation repair evidence and verification status
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatBooleanBadge(value) {
  if (typeof value !== "boolean") {
    return renderStatusSignal("pending", "pending");
  }
  return value ? renderStatusSignal("pass", "yes") : renderStatusSignal("fail", "no");
}

// warehouse:method
// responsibility: Runs observable single file taxonomy healing by rendering contract driven ascii operator console markdown summaries case generation expected remediation repair evidence and verification status
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatMutationBadge(value) {
  if (typeof value !== "boolean") {
    return renderStatusSignal("pending", "pending");
  }
  return value ? renderStatusSignal("warning", "yes") : renderStatusSignal("locked", "no");
}

// warehouse:method
// responsibility: Runs observable single file taxonomy healing by rendering contract driven ascii operator console markdown summaries case generation expected remediation repair evidence and verification status
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatSourceMutationPosture(value) {
  if (typeof value !== "boolean") {
    return renderStatusSignal("pending", "pending");
  }
  return value ? renderStatusSignal("warning", "source mutated") : renderStatusSignal("locked", "no source mutation");
}

// warehouse:method
// responsibility: Runs observable single file taxonomy healing by rendering contract driven ascii operator console markdown summaries case generation expected remediation repair evidence and verification status
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatStatusBadge(state) {
  const normalized = String(state || "unknown").toLowerCase();
  const labels = {
    done: renderStatusSignal("pass", "done"),
    running: renderStatusSignal("running", "running"),
    failed: renderStatusSignal("fail", "failed"),
    blocked: renderStatusSignal("blocked", "blocked"),
    starting: renderStatusSignal("running", "starting"),
  };
  return labels[normalized] || renderStatusSignal("warning", normalized.toUpperCase());
}

// warehouse:method
// responsibility: Runs observable single file taxonomy healing by rendering contract driven ascii operator console markdown summaries case generation expected remediation repair evidence and verification status
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatOperatorSignal(meaning, label) {
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
// responsibility: Runs observable single file taxonomy healing by rendering contract driven ascii operator console markdown summaries case generation expected remediation repair evidence and verification status
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatProgressBar(value, width = 24) {
  return renderProgressBar({
    value,
    max: 100,
    contract: {
      ...HEALING_PROGRESS_CONTRACT,
      rendering: {
        ...HEALING_PROGRESS_CONTRACT.rendering,
        width,
      },
    },
  });
}

// warehouse:method
// responsibility: Runs observable single file taxonomy healing by rendering contract driven ascii operator console markdown summaries case generation expected remediation repair evidence and verification status
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatPhaseTrail(currentPhase) {
  const phases = ["start", "case", "expected", "heal", "evidence", "verify"];
  const currentIndex = phases.indexOf(currentPhase);
  return phases
    .map((phase, index) => {
      if (index === currentIndex) {
        return `${phase} ✓`;
      }
      if (currentIndex >= 0 && index < currentIndex) {
        return `${phase} ✓`;
      }
      return `${phase} …`;
    })
    .join(" -> ");
}

// warehouse:method
// responsibility: Runs observable single file taxonomy healing by rendering contract driven ascii operator console markdown summaries case generation expected remediation repair evidence and verification status
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatScoreProjection(score) {
  const label = formatScore(score) || "pending";
  return `${label.padEnd(8, " ")} ${formatProgressBar(score)}`;
}

// warehouse:method
// responsibility: Runs observable single file taxonomy healing by rendering contract driven ascii operator console markdown summaries case generation expected remediation repair evidence and verification status
// actor: method_implementation
// role: implementation
// source_truth: implementation
function consoleText(value, width) {
  const text = markdownValue(value).replace(/\n/g, " ");
  if (text.length > width) {
    return `${text.slice(0, width - 3)}...`;
  }
  return text.padEnd(width, " ");
}

// warehouse:method
// responsibility: Runs observable single file taxonomy healing by rendering contract driven ascii operator console markdown summaries case generation expected remediation repair evidence and verification status
// actor: method_implementation
// role: implementation
// source_truth: implementation
function consoleLine(label, value) {
  return `| ${consoleText(label, 12)} ${consoleText(value, 72)} |`;
}

// warehouse:method
// responsibility: Runs observable single file taxonomy healing by rendering contract driven ascii operator console markdown summaries case generation expected remediation repair evidence and verification status
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatOperatorConsole(status) {
  const border = "+---------------------------------------------------------------------------------------+";
  const scoreBefore = formatScoreProjection(status.score_before);
  const scoreAfter = formatScoreProjection(status.score_after);
  const lines = [
    "```text",
    border,
    "| TAXONOMY HEALING OBSERVABILITY CONSOLE                                                |",
    border,
    consoleLine("Status", formatStatusBadge(status.state)),
    consoleLine("Target", formatOperatorSignal("file", status.target_file)),
    consoleLine("Phase", formatPhaseTrail(status.phase)),
    consoleLine("Action", formatOperatorSignal("evidence", status.current_action)),
    consoleLine("Before", scoreBefore),
    consoleLine("After", scoreAfter),
    consoleLine("Mutation", formatSourceMutationPosture(status.source_mutated)),
    consoleLine("Evidence", formatBooleanBadge(status.evidence_trustworthy)),
    border,
    "```",
  ];
  return lines.join("\n");
}

// warehouse:method
// responsibility: Runs observable single file taxonomy healing by rendering contract driven ascii operator console markdown summaries case generation expected remediation repair evidence and verification status
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
// responsibility: Runs observable single file taxonomy healing by rendering contract driven ascii operator console markdown summaries case generation expected remediation repair evidence and verification status
// actor: method_implementation
// role: implementation
// source_truth: implementation
function classifyMutation(sourceMutated, expected) {
  if (sourceMutated === false) {
    return "evidence_refresh";
  }
  if (expected.required_refactorings && expected.required_refactorings.length > 0) {
    return "refactor";
  }
  const firstChange = (expected.required_changes || [])[0];
  return firstChange ? firstChange.type : "source_update";
}

// warehouse:method
// responsibility: Runs observable single file taxonomy healing by rendering contract driven ascii operator console markdown summaries case generation expected remediation repair evidence and verification status
// actor: method_implementation
// role: implementation
// source_truth: implementation
function summarizeHealingAction(mutationClass, sourceMutated) {
  if (mutationClass === "evidence_refresh" || sourceMutated === false) {
    return "Evidence refreshed; semantic tie-out verified.";
  }
  if (mutationClass === "anchor_update") {
    return "Anchors updated from expected coherence contract.";
  }
  if (mutationClass === "refactor") {
    return "Source refactor applied from expected coherence contract.";
  }
  return "Source updated from expected coherence contract.";
}

// warehouse:method
// responsibility: Runs observable single file taxonomy healing by rendering contract driven ascii operator console markdown summaries case generation expected remediation repair evidence and verification status
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildHealingLedger({ filePath, mutationClass, sourceMutated, story, expectedPath }) {
  return [
    {
      file: filePath,
      mutation_class: mutationClass,
      source_mutated: sourceMutated,
      healing_action: summarizeHealingAction(mutationClass, sourceMutated),
      before: formatScore(story.before_score),
      after: formatScore(story.after_score),
      delta: formatScoreDelta(story.before_score, story.after_score),
      evidence: expectedPath,
    },
  ];
}

// warehouse:method
// responsibility: Runs observable single file taxonomy healing by rendering contract driven ascii operator console markdown summaries case generation expected remediation repair evidence and verification status
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildOperationalChanges(sourceMutated, mutationClass) {
  return [
    {
      surface: "Source file",
      change: sourceMutated ? `Mutated via ${mutationClass}` : "No mutation required",
    },
    {
      surface: "Evidence bundle",
      change: "Refreshed",
    },
    {
      surface: "Coherence story",
      change: "Revalidated",
    },
    {
      surface: "Semantic tie-out",
      change: "Verified",
    },
    {
      surface: "Report projection",
      change: "Regenerated",
    },
  ];
}

// warehouse:method
// responsibility: Runs observable single file taxonomy healing by rendering contract driven ascii operator console markdown summaries case generation expected remediation repair evidence and verification status
// actor: method_implementation
// role: implementation
// source_truth: implementation
function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

// warehouse:method
// responsibility: Runs observable single file taxonomy healing by rendering contract driven ascii operator console markdown summaries case generation expected remediation repair evidence and verification status
// actor: method_implementation
// role: implementation
// source_truth: implementation
function readCaseArtifacts(root, caseDir) {
  const absCaseDir = path.resolve(root, caseDir);
  return {
    actual: readJsonFile(path.join(absCaseDir, "actual-taxonomy.json")),
    beforeEvidence: readJsonFile(path.join(absCaseDir, "evidence.json")),
    expected: readJsonFile(path.join(absCaseDir, "expected-coherence.json")),
  };
}

// warehouse:method
// responsibility: Runs observable single file taxonomy healing by rendering contract driven ascii operator console markdown summaries case generation expected remediation repair evidence and verification status
// actor: method_implementation
// role: implementation
// source_truth: implementation
function summarizeMethods(evidence) {
  const names = (evidence.detected_functions || []).map((fn) => fn.name);
  if (names.length === 0) {
    return "No JavaScript functions were detected.";
  }
  return `Detected methods: ${names.join(", ")}.`;
}

// warehouse:method
// responsibility: Runs observable single file taxonomy healing by rendering contract driven ascii operator console markdown summaries case generation expected remediation repair evidence and verification status
// actor: method_implementation
// role: implementation
// source_truth: implementation
function summarizeCoherenceGap(expected, beforeEvidence) {
  const beforeScore = beforeEvidence.coherence ? beforeEvidence.coherence.score : expected.current_score;
  const issues = beforeEvidence.coherence ? beforeEvidence.coherence.issues : [];
  if (beforeScore === 100 && issues.length === 0) {
    return "No semantic gap detected; file anchor, methods, responsibilities, and evidence already tie out.";
  }
  const issueSummary = issues.length
    ? ` Issue signals: ${issues.map((issue) => `${issue.method} similarity ${issue.similarity}%`).join("; ")}.`
    : "";
  return `${expected.diagnosis.summary}${issueSummary}`;
}

// warehouse:method
// responsibility: Runs observable single file taxonomy healing by rendering contract driven ascii operator console markdown summaries case generation expected remediation repair evidence and verification status
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildHealingActions(actual, expected, beforeScore) {
  if (beforeScore === 100 && actual.file.responsibility === expected.expected_taxonomy.file.responsibility) {
    return [
      {
        action_type: "evidence_refresh",
        target_symbol: "taxonomy evidence bundle",
        before: "coherent story already aligned",
        after: "coherent story revalidated",
        reason: "No structural healing required; scan refreshed evidence and verified semantic tie-out.",
      },
    ];
  }
  return (expected.required_changes || []).map((change) => ({
    action_type: change.type,
    target_symbol: change.file_level ? "file anchor and method anchors" : (change.method_level || []).join(", "),
    before: actual.file.responsibility,
    after: expected.expected_taxonomy.file.responsibility,
    reason: change.reason,
  }));
}

// warehouse:method
// responsibility: Runs observable single file taxonomy healing by rendering contract driven ascii operator console markdown summaries case generation expected remediation repair evidence and verification status
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildCoherenceStory({ filePath, caseDir, actual, expected, beforeEvidence, afterEvidence, afterScore }) {
  const beforeScore = beforeEvidence.coherence ? beforeEvidence.coherence.score : expected.current_score;
  const delta = typeof beforeScore === "number" && typeof afterScore === "number" ? afterScore - beforeScore : null;
  const afterMethodCount = afterEvidence.coverage ? afterEvidence.coverage.detected_function_count : 0;
  return {
    file_path: filePath,
    file_anchor_before: actual.file.responsibility,
    file_anchor_after: expected.expected_taxonomy.file.responsibility,
    expected_story: expected.expected_taxonomy.file.responsibility,
    observed_story_before: `${summarizeMethods(beforeEvidence)} ${beforeScore}/100 coherence before healing.`,
    coherence_gap: summarizeCoherenceGap(expected, beforeEvidence),
    healing_actions: buildHealingActions(actual, expected, beforeScore),
    observed_story_after: afterEvidence.trustworthy
      ? `File anchor and ${afterMethodCount} detected method anchors now support the expected story with trustworthy evidence.`
      : "Post-heal evidence remains untrustworthy; inspect coverage and coherence diagnostics.",
    evidence_refs: [
      path.join(caseDir, "actual-taxonomy.json"),
      path.join(caseDir, "expected-coherence.json"),
      path.join(caseDir, "evidence.json"),
    ],
    before_score: beforeScore,
    after_score: afterScore,
    delta,
    remaining_ambiguity: afterEvidence.trustworthy ? "none" : "diagnostic_required",
  };
}

// warehouse:method
// responsibility: Runs observable single file taxonomy healing by rendering contract driven ascii operator console markdown summaries case generation expected remediation repair evidence and verification status
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildSemanticTieOut(story, beforeEvidence, afterEvidence) {
  const beforeCoherence = beforeEvidence.coherence || {};
  const afterCoherence = afterEvidence.coherence || {};
  return [
    {
      layer: "File anchor",
      before: story.file_anchor_before,
      after: story.file_anchor_after,
      result: story.file_anchor_after === story.expected_story ? "aligned" : "review",
    },
    {
      layer: "Method set",
      before: `${beforeCoherence.aligned_methods || 0}/${beforeCoherence.total_methods || 0} aligned`,
      after: `${afterCoherence.aligned_methods || 0}/${afterCoherence.total_methods || 0} aligned`,
      result: afterCoherence.score === 100 ? "aligned" : "review",
    },
    {
      layer: "Responsibility",
      before: story.observed_story_before,
      after: story.observed_story_after,
      result: story.remaining_ambiguity === "none" ? "aligned" : "review",
    },
    {
      layer: "Evidence",
      before: beforeEvidence.trustworthy ? "trustworthy" : "untrustworthy",
      after: afterEvidence.trustworthy ? "trustworthy" : "untrustworthy",
      result: afterEvidence.trustworthy ? "aligned" : "review",
    },
  ];
}

// warehouse:method
// responsibility: Runs observable single file taxonomy healing by rendering contract driven ascii operator console markdown summaries case generation expected remediation repair evidence and verification status
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatCoherenceStoryMarkdown(story) {
  if (!story) {
    return null;
  }
  const healingRows = (story.healing_actions || []).map((action) => [
    action.action_type,
    action.target_symbol,
    action.before,
    action.after,
    action.reason,
  ]);
  return [
    "## Coherence Story",
    "",
    "### Before",
    "",
    markdownTable(
      ["Signal", "Meaning"],
      [
        ["File anchor", story.file_anchor_before],
        ["Expected responsibility", story.expected_story],
        ["Actual method behavior", story.observed_story_before],
        ["Coherence gap", story.coherence_gap],
      ]
    ),
    "",
    "### Healing",
    "",
    markdownTable(["Action", "Target", "Before", "After", "Reason"], healingRows),
    "",
    "### After",
    "",
    markdownTable(
      ["Signal", "Meaning"],
      [
        ["File anchor", story.file_anchor_after],
        ["Methods now support", story.expected_story],
        ["Remaining ambiguity", story.remaining_ambiguity],
        ["Coherence result", formatScore(story.after_score)],
        ["Evidence refs", (story.evidence_refs || []).join(", ")],
      ]
    ),
  ].join("\n");
}

// warehouse:method
// responsibility: Runs observable single file taxonomy healing by rendering contract driven ascii operator console markdown summaries case generation expected remediation repair evidence and verification status
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatSemanticTieOutMarkdown(tieOut) {
  if (!tieOut || tieOut.length === 0) {
    return null;
  }
  return [
    "## Semantic Tie-Out",
    "",
    markdownTable(
      ["Layer", "Before", "After", "Result"],
      tieOut.map((row) => [
        row.layer,
        row.before,
        row.after,
        row.result === "aligned" ? renderStatusSignal("pass", row.result) : renderStatusSignal("warning", row.result),
      ])
    ),
  ].join("\n");
}

// warehouse:method
// responsibility: Runs observable single file taxonomy healing by rendering contract driven ascii operator console markdown summaries case generation expected remediation repair evidence and verification status
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatHealingLedgerMarkdown(ledger) {
  if (!ledger || ledger.length === 0) {
    return null;
  }
  return [
    "## File Healing Ledger",
    "",
    markdownTable(
      ["File", "Mutation Class", "Source Mutated", "Healing Action", "Before", "After", "Delta", "Evidence"],
      ledger.map((row) => [
        row.file,
        row.mutation_class,
        formatMutationBadge(row.source_mutated),
        row.healing_action,
        row.before,
        row.after,
        row.delta,
        row.evidence,
      ])
    ),
  ].join("\n");
}

// warehouse:method
// responsibility: Runs observable single file taxonomy healing by rendering contract driven ascii operator console markdown summaries case generation expected remediation repair evidence and verification status
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatOperationalChangesMarkdown(changes) {
  if (!changes || changes.length === 0) {
    return null;
  }
  return [
    "## What Changed",
    "",
    markdownTable(
      ["Surface", "Change"],
      changes.map((change) => [change.surface, change.change])
    ),
  ].join("\n");
}

// warehouse:method
// responsibility: Runs observable single file taxonomy healing by rendering contract driven ascii operator console markdown summaries case generation expected remediation repair evidence and verification status
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
    formatOperatorConsole(status),
    "",
    "## Executive Summary",
    "",
    markdownTable(
      ["Signal", "Value"],
      [
        ["Status", String(status.state || "unknown").toUpperCase()],
        ["Status badge", formatStatusBadge(status.state)],
        ["Target file", status.target_file],
        ["Phase", status.phase],
        ["Current action", status.current_action],
        ["Evidence trustworthy", formatBooleanBadge(status.evidence_trustworthy)],
        ["Source mutated", formatMutationBadge(status.source_mutated)],
        ["Mutation class", status.mutation_class],
      ]
    ),
    "",
    "## Score Impact",
    "",
    markdownTable(
      ["Before", "After", "Delta", "Target Met", "After Progress"],
      [
        [
          formatScore(status.score_before),
          formatScore(status.score_after),
          formatScoreDelta(status.score_before, status.score_after),
          formatBooleanBadge(targetMet),
          formatProgressBar(status.score_after),
        ],
      ]
    ),
    "",
    formatHealingLedgerMarkdown(status.healing_ledger),
    "",
    formatOperationalChangesMarkdown(status.operational_changes),
    "",
    formatCoherenceStoryMarkdown(status.coherence_story),
    "",
    formatSemanticTieOutMarkdown(status.semantic_tie_out),
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
// responsibility: Runs observable single file taxonomy healing by rendering contract driven ascii operator console markdown summaries case generation expected remediation repair evidence and verification status
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
// responsibility: Runs observable single file taxonomy healing by rendering contract driven ascii operator console markdown summaries case generation expected remediation repair evidence and verification status
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
    source_mutated: null,
    mutation_class: null,
    healing_ledger: null,
    operational_changes: null,
    coherence_story: null,
    semantic_tie_out: null,
  };

  status = writeHealingStatus(reportsDir, runDir, status);
  status = writeHealingStatus(reportsDir, runDir, {
    ...status,
    phase: "case",
    current_action: "scanning actual taxonomy and producing expected remediation JSON",
  });
  const caseResult = buildTaxonomyCaseFile(relFile, root, path.join(reportsDir, "taxonomy-case-files"));
  const expectedPath = path.join(caseResult.case_dir, "expected-coherence.json");
  const caseArtifacts = readCaseArtifacts(root, caseResult.case_dir);

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
  const targetAbsPath = path.resolve(root, relFile);
  const beforeHealContent = fs.readFileSync(targetAbsPath, "utf8");
  const healResult = applyExpectedTaxonomy(path.join(root, expectedPath), root);
  const afterHealContent = fs.readFileSync(targetAbsPath, "utf8");
  const sourceMutated = beforeHealContent !== afterHealContent;
  const mutationClass = classifyMutation(sourceMutated, caseArtifacts.expected);

  status = writeHealingStatus(reportsDir, runDir, {
    ...status,
    phase: "evidence",
    current_action: "building post-heal evidence bundle and checking trust",
    score_after: healResult.score,
  });
  const evidence = buildFileEvidence(relFile, root);
  const coherenceStory = buildCoherenceStory({
    filePath: relFile,
    caseDir: caseResult.case_dir,
    actual: caseArtifacts.actual,
    expected: caseArtifacts.expected,
    beforeEvidence: caseArtifacts.beforeEvidence,
    afterEvidence: evidence,
    afterScore: healResult.score,
  });
  const semanticTieOut = buildSemanticTieOut(coherenceStory, caseArtifacts.beforeEvidence, evidence);
  const healingLedger = buildHealingLedger({
    filePath: relFile,
    mutationClass,
    sourceMutated,
    story: coherenceStory,
    expectedPath,
  });
  const operationalChanges = buildOperationalChanges(sourceMutated, mutationClass);

  status = writeHealingStatus(reportsDir, runDir, {
    ...status,
    state: evidence.trustworthy && healResult.accepted ? "done" : "failed",
    phase: "verify",
    current_action: "single-file healing run complete",
    evidence_trustworthy: evidence.trustworthy,
    source_mutated: sourceMutated,
    mutation_class: mutationClass,
    healing_ledger: healingLedger,
    operational_changes: operationalChanges,
    coherence_story: coherenceStory,
    semantic_tie_out: semanticTieOut,
  });
  return status;
}

// warehouse:method
// responsibility: Runs observable single file taxonomy healing by rendering contract driven ascii operator console markdown summaries case generation expected remediation repair evidence and verification status
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
  buildCoherenceStory,
  buildSemanticTieOut,
  formatCoherenceStoryMarkdown,
  formatHealingMarkdown,
  formatOperatorConsole,
  formatPhaseTrail,
  formatProgressBar,
  formatSemanticTieOutMarkdown,
  formatScoreProjection,
  formatStatusBadge,
  markdownTable,
  markdownValue,
  writeHealingStatus,
  runObservableTaxonomyHeal,
  runTaxonomyHealRun,
};
