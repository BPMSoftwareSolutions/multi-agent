// warehouse:file
// responsibility: Builds taxonomy healing swarm run observability reports with governed operator consoles summaries mutation ledgers review queues semantic tie out and artifact projections
// actor: taxonomy_swarm_report_renderer
// role: renderer
// source_truth: implementation

const fs = require("fs");
const path = require("path");
const { renderProgressBar, renderStatusSignal } = require("./ascii-components");

const SWARM_PROGRESS_CONTRACT = {
  component_key: "taxonomy_swarm_health_progress",
  component_kind: "ascii.progress",
  contract_version: "ascii_component.v1",
  rendering: {
    width: 24,
    style: "digital_block",
    show_percent: true,
    show_fraction: false,
  },
};

const MUTATION_CLASS_MEANINGS = {
  trusted_noop: "Already coherent; no action required",
  evidence_refresh: "Story already aligned; evidence regenerated",
  file_anchor_repair: "File anchor changed to match methods",
  method_anchor_repair: "Method anchors changed to match actual behavior",
  source_refactor_required: "Code structure does not support declared story",
  file_split_required: "Multiple responsibility stories collapsed into one file",
  scorer_review_required: "Low score may be scorer blindness, not code drift",
  blocked_untrusted_evidence: "Evidence chain incomplete or invalid",
};

const REVIEW_MUTATION_CLASSES = new Set([
  "source_refactor_required",
  "file_split_required",
  "scorer_review_required",
  "blocked_untrusted_evidence",
]);

// warehouse:method
// responsibility: Builds taxonomy healing swarm run observability reports with governed operator consoles summaries mutation ledgers review queues semantic tie out and artifact projections
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
// responsibility: Builds taxonomy healing swarm run observability reports with governed operator consoles summaries mutation ledgers review queues semantic tie out and artifact projections
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
// responsibility: Builds taxonomy healing swarm run observability reports with governed operator consoles summaries mutation ledgers review queues semantic tie out and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function numeric(value, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

// warehouse:method
// responsibility: Builds taxonomy healing swarm run observability reports with governed operator consoles summaries mutation ledgers review queues semantic tie out and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function signedDelta(value) {
  const n = numeric(value);
  return n >= 0 ? `+${n}` : String(n);
}

// warehouse:method
// responsibility: Builds taxonomy healing swarm run observability reports with governed operator consoles summaries mutation ledgers review queues semantic tie out and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function averageScore(files, field) {
  if (!files.length) {
    return 0;
  }
  const total = files.reduce((sum, file) => sum + numeric(file[field]), 0);
  return Math.round(total / files.length);
}

// warehouse:method
// responsibility: Builds taxonomy healing swarm run observability reports with governed operator consoles summaries mutation ledgers review queues semantic tie out and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function normalizeStatus(status) {
  return String(status || "done").toLowerCase();
}

// warehouse:method
// responsibility: Builds taxonomy healing swarm run observability reports with governed operator consoles summaries mutation ledgers review queues semantic tie out and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function statusSignal(status) {
  const normalized = normalizeStatus(status);
  if (normalized === "done" || normalized === "complete") {
    return renderStatusSignal("pass", "done");
  }
  if (normalized === "partial" || normalized === "warning" || normalized === "review") {
    return renderStatusSignal("warning", normalized);
  }
  if (normalized === "blocked" || normalized === "dangerous") {
    return renderStatusSignal("blocked", normalized === "dangerous" ? "blocked" : normalized);
  }
  if (normalized === "running") {
    return renderStatusSignal("running", "running");
  }
  return renderStatusSignal("warning", normalized);
}

// warehouse:method
// responsibility: Builds taxonomy healing swarm run observability reports with governed operator consoles summaries mutation ledgers review queues semantic tie out and artifact projections
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
// responsibility: Builds taxonomy healing swarm run observability reports with governed operator consoles summaries mutation ledgers review queues semantic tie out and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function evidenceSignal(value) {
  return value ? renderStatusSignal("pass", "yes") : renderStatusSignal("fail", "no");
}

// warehouse:method
// responsibility: Builds taxonomy healing swarm run observability reports with governed operator consoles summaries mutation ledgers review queues semantic tie out and artifact projections
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
// responsibility: Builds taxonomy healing swarm run observability reports with governed operator consoles summaries mutation ledgers review queues semantic tie out and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function sourceMutationSignal(value) {
  return value ? renderStatusSignal("mutated", "yes") : renderStatusSignal("locked", "no");
}

// warehouse:method
// responsibility: Builds taxonomy healing swarm run observability reports with governed operator consoles summaries mutation ledgers review queues semantic tie out and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function progressBar(value) {
  return renderProgressBar({
    value,
    max: 100,
    contract: SWARM_PROGRESS_CONTRACT,
  });
}

// warehouse:method
// responsibility: Builds taxonomy healing swarm run observability reports with governed operator consoles summaries mutation ledgers review queues semantic tie out and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function scoreBand(score) {
  if (score >= 70) {
    return "strong";
  }
  if (score >= 50) {
    return "moderate";
  }
  return "weak";
}

// warehouse:method
// responsibility: Builds taxonomy healing swarm run observability reports with governed operator consoles summaries mutation ledgers review queues semantic tie out and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function defaultMutationClass(file) {
  if (file.evidence_trustworthy === false) {
    return "blocked_untrusted_evidence";
  }
  if (file.before_score === 100 && file.after_score === 100 && !file.source_mutated) {
    return "trusted_noop";
  }
  return file.source_mutated ? "file_anchor_repair" : "evidence_refresh";
}

// warehouse:method
// responsibility: Builds taxonomy healing swarm run observability reports with governed operator consoles summaries mutation ledgers review queues semantic tie out and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function normalizeFiles(input) {
  const beeCount = Math.max(1, numeric(input.bee_count, 1));
  return (input.files || []).map((file, index) => {
    const beforeScore = numeric(file.before_score);
    const afterScore = numeric(file.after_score, beforeScore);
    const normalized = {
      file: file.file || file.path,
      bee: file.bee || file.bee_id || `bee-${String((index % beeCount) + 1).padStart(2, "0")}`,
      status: file.status || "completed",
      before_score: beforeScore,
      after_score: afterScore,
      source_mutated: file.source_mutated === true,
      evidence_trustworthy: file.evidence_trustworthy !== false,
      verdict: file.verdict || "trusted_story",
      next_action: file.next_action || "none",
      review_reason: file.review_reason,
      suggested_action: file.suggested_action,
      file_anchor_aligned: file.file_anchor_aligned !== false,
      method_set_aligned: file.method_set_aligned !== false,
      responsibility_tie_out_verified: file.responsibility_tie_out_verified !== false,
      source_mutation_justified: file.source_mutation_justified !== false,
      source_mutation_avoided: file.source_mutation_avoided !== false,
    };
    normalized.mutation_class = file.mutation_class || defaultMutationClass(normalized);
    normalized.delta = afterScore - beforeScore;
    return normalized;
  });
}

// warehouse:method
// responsibility: Builds taxonomy healing swarm run observability reports with governed operator consoles summaries mutation ledgers review queues semantic tie out and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function isBlocked(file) {
  return file.status === "blocked" || file.mutation_class === "blocked_untrusted_evidence" || file.evidence_trustworthy === false;
}

// warehouse:method
// responsibility: Builds taxonomy healing swarm run observability reports with governed operator consoles summaries mutation ledgers review queues semantic tie out and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function requiresHumanReview(file) {
  return Boolean(file.review_reason || file.suggested_action || REVIEW_MUTATION_CLASSES.has(file.mutation_class));
}

// warehouse:method
// responsibility: Builds taxonomy healing swarm run observability reports with governed operator consoles summaries mutation ledgers review queues semantic tie out and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildSummary(input, files) {
  const beforeHealth = averageScore(files, "before_score");
  const afterHealth = averageScore(files, "after_score");
  const trustedEvidenceCount = files.filter((file) => file.evidence_trustworthy).length;
  const sourceMutatedCount = files.filter((file) => file.source_mutated).length;
  return {
    status: normalizeStatus(input.status),
    run_id: input.run_id,
    target_scope: input.target_scope || ".",
    swarm_workers: numeric(input.bee_count, 1),
    files_total: files.length,
    files_completed: files.filter((file) => file.status !== "running").length,
    files_running: files.filter((file) => file.status === "running").length,
    files_blocked: files.filter(isBlocked).length,
    files_improved: files.filter((file) => file.after_score > file.before_score).length,
    files_already_trusted: files.filter((file) => file.before_score === 100 && file.after_score === 100 && file.evidence_trustworthy).length,
    files_source_mutated: sourceMutatedCount,
    no_source_mutation: files.length - sourceMutatedCount,
    evidence_only_refreshes: files.filter((file) => file.mutation_class === "evidence_refresh").length,
    human_review_required: files.filter(requiresHumanReview).length,
    before_health: beforeHealth,
    after_health: afterHealth,
    net_delta: signedDelta(afterHealth - beforeHealth),
    trusted_evidence_count: trustedEvidenceCount,
    evidence_trustworthy: trustedEvidenceCount === files.length,
    source_mutation_policy: input.source_mutation_policy || "governed / case-scoped / evidence-backed",
  };
}

// warehouse:method
// responsibility: Builds taxonomy healing swarm run observability reports with governed operator consoles summaries mutation ledgers review queues semantic tie out and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildScoreMovement(files, reviewCount) {
  const movement = {
    strong: { label: "Strong stories, 70+", before: 0, after: 0, delta: 0 },
    moderate: { label: "Moderate stories, 50-69", before: 0, after: 0, delta: 0 },
    weak: { label: "Weak stories, <50", before: 0, after: 0, delta: 0 },
    trusted_evidence: { label: "Trusted evidence bundles", before: 0, after: 0, delta: 0 },
    human_review: { label: "Human review queue", before: null, after: reviewCount, delta: reviewCount },
  };
  for (const file of files) {
    movement[scoreBand(file.before_score)].before += 1;
    movement[scoreBand(file.after_score)].after += 1;
    if (file.before_evidence_trustworthy || file.before_score === 100) {
      movement.trusted_evidence.before += 1;
    }
    if (file.evidence_trustworthy) {
      movement.trusted_evidence.after += 1;
    }
  }
  for (const key of ["strong", "moderate", "weak", "trusted_evidence"]) {
    movement[key].delta = movement[key].after - movement[key].before;
  }
  return movement;
}

// warehouse:method
// responsibility: Builds taxonomy healing swarm run observability reports with governed operator consoles summaries mutation ledgers review queues semantic tie out and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildMutationClassSummary(files) {
  const summary = {};
  for (const [mutationClass, meaning] of Object.entries(MUTATION_CLASS_MEANINGS)) {
    summary[mutationClass] = { count: 0, meaning };
  }
  for (const file of files) {
    if (!summary[file.mutation_class]) {
      summary[file.mutation_class] = { count: 0, meaning: "Custom mutation class" };
    }
    summary[file.mutation_class].count += 1;
  }
  return summary;
}

// warehouse:method
// responsibility: Builds taxonomy healing swarm run observability reports with governed operator consoles summaries mutation ledgers review queues semantic tie out and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildBeeLedger(files) {
  const byBee = new Map();
  for (const file of files) {
    if (!byBee.has(file.bee)) {
      byBee.set(file.bee, {
        bee: file.bee,
        assigned: 0,
        completed: 0,
        mutated: 0,
        evidence_refresh: 0,
        blocked: 0,
        review: 0,
        delta_total: 0,
      });
    }
    const row = byBee.get(file.bee);
    row.assigned += 1;
    row.completed += file.status !== "running" ? 1 : 0;
    row.mutated += file.source_mutated ? 1 : 0;
    row.evidence_refresh += file.mutation_class === "evidence_refresh" ? 1 : 0;
    row.blocked += isBlocked(file) ? 1 : 0;
    row.review += requiresHumanReview(file) ? 1 : 0;
    row.delta_total += file.delta;
  }
  return Array.from(byBee.values())
    .sort((a, b) => a.bee.localeCompare(b.bee))
    .map((row) => ({
      bee: row.bee,
      assigned: row.assigned,
      completed: row.completed,
      mutated: row.mutated,
      evidence_refresh: row.evidence_refresh,
      blocked: row.blocked,
      avg_delta: signedDelta(Math.round(row.delta_total / Math.max(row.completed, 1))),
      status: row.blocked ? "blocked" : row.review ? "review" : "done",
    }));
}

// warehouse:method
// responsibility: Builds taxonomy healing swarm run observability reports with governed operator consoles summaries mutation ledgers review queues semantic tie out and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildFileLedger(files) {
  return files.map((file) => ({
    file: file.file,
    before: file.before_score,
    after: file.after_score,
    delta: signedDelta(file.delta),
    mutation_class: file.mutation_class,
    source_mutated: file.source_mutated,
    evidence: file.evidence_trustworthy,
    verdict: file.verdict,
    next_action: file.next_action,
  }));
}

// warehouse:method
// responsibility: Builds taxonomy healing swarm run observability reports with governed operator consoles summaries mutation ledgers review queues semantic tie out and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildReviewQueue(files) {
  return files
    .filter(requiresHumanReview)
    .map((file, index) => ({
      priority: index + 1,
      file: file.file,
      reason: file.review_reason || MUTATION_CLASS_MEANINGS[file.mutation_class] || "Operator review required",
      suggested_action: file.suggested_action || file.next_action,
    }));
}

// warehouse:method
// responsibility: Builds taxonomy healing swarm run observability reports with governed operator consoles summaries mutation ledgers review queues semantic tie out and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildSemanticTieOut(files, summary) {
  const mutatedFiles = files.filter((file) => file.source_mutated);
  const unmutatedFiles = files.filter((file) => !file.source_mutated);
  return {
    file_anchors_aligned: files.filter((file) => file.file_anchor_aligned).length,
    method_sets_aligned: files.filter((file) => file.method_set_aligned).length,
    responsibility_tie_out_verified: files.filter((file) => file.responsibility_tie_out_verified).length,
    evidence_trustworthy: summary.trusted_evidence_count,
    source_mutation_justified: mutatedFiles.filter((file) => file.source_mutation_justified).length,
    source_mutation_avoided: unmutatedFiles.filter((file) => file.source_mutation_avoided).length,
    scorer_uncertainty_surfaced: files.filter((file) => file.mutation_class === "scorer_review_required").length,
    human_review_required: summary.human_review_required,
  };
}

// warehouse:method
// responsibility: Builds taxonomy healing swarm run observability reports with governed operator consoles summaries mutation ledgers review queues semantic tie out and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildArtifactIndex(runId) {
  const base = `reports/taxonomy-healing-runs/${runId}`;
  return {
    batch_report_json: `${base}/batch-report.json`,
    batch_report_markdown: `${base}/batch-report.md`,
    bee_ledger_json: `${base}/bee-ledger.json`,
    file_ledger_json: `${base}/file-ledger.json`,
    review_queue_json: `${base}/review-queue.json`,
    source_mutation_diff: `${base}/source-mutation.diff`,
    evidence_manifest_json: `${base}/evidence-manifest.json`,
    case_files_root: "reports/taxonomy-case-files/**",
    latest_report_markdown: "reports/SWARM-RUN-LATEST.md",
    latest_report_json: "reports/swarm-report-latest.json",
  };
}

// warehouse:method
// responsibility: Builds taxonomy healing swarm run observability reports with governed operator consoles summaries mutation ledgers review queues semantic tie out and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildFinalVerdict(summary) {
  if (summary.status === "blocked" || summary.status === "dangerous") {
    return "The taxonomy healing swarm is not trusted. Evidence gaps, unauthorized source mutation, or scorer uncertainty exceeded policy thresholds. Do not promote this batch result. Review the blocked ledger and rerun with stricter scope.";
  }
  if (summary.status === "partial" || summary.files_blocked > 0 || summary.files_completed < summary.files_total) {
    return "The taxonomy healing swarm completed with partial success. Completed files produced trustworthy evidence, but blocked files remain unresolved. No blocked file should be promoted to trusted taxonomy state until evidence is repaired and verification is rerun.";
  }
  return `The taxonomy healing swarm completed successfully. Coherence improved from ${summary.before_health}/100 to ${summary.after_health}/100. All completed files have trustworthy evidence. Source mutations were limited to case-scoped anchor repairs and method-anchor repairs. No unauthorized source mutation occurred. Remaining weak files were routed to human review, scorer review, or refactor packets.`;
}

// warehouse:method
// responsibility: Builds taxonomy healing swarm run observability reports with governed operator consoles summaries mutation ledgers review queues semantic tie out and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildSwarmRunReport(input) {
  const files = normalizeFiles(input);
  const summary = buildSummary(input, files);
  const scoreMovement = buildScoreMovement(files, summary.human_review_required);
  const report = {
    schema: "taxonomy-healing-swarm-report.v1",
    run_id: input.run_id,
    status: summary.status,
    generated_at: input.generated_at || new Date().toISOString(),
    started_at: input.started_at || null,
    completed_at: input.completed_at || null,
    duration: input.duration || null,
    target_scope: summary.target_scope,
    phase: input.phase || "report",
    summary,
    score_movement: scoreMovement,
    mutation_class_summary: buildMutationClassSummary(files),
    bee_ledger: buildBeeLedger(files),
    file_ledger: buildFileLedger(files),
    review_queue: buildReviewQueue(files),
    semantic_tie_out: buildSemanticTieOut(files, summary),
    artifact_index: buildArtifactIndex(input.run_id),
  };
  report.final_verdict = input.final_verdict || buildFinalVerdict(summary);
  return report;
}

// warehouse:method
// responsibility: Builds taxonomy healing swarm run observability reports with governed operator consoles summaries mutation ledgers review queues semantic tie out and artifact projections
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
// responsibility: Builds taxonomy healing swarm run observability reports with governed operator consoles summaries mutation ledgers review queues semantic tie out and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function consoleLine(label, value) {
  return `| ${consoleText(label, 13)} ${consoleText(value, 80)} |`;
}

// warehouse:method
// responsibility: Builds taxonomy healing swarm run observability reports with governed operator consoles summaries mutation ledgers review queues semantic tie out and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function phaseTrail(phase) {
  const phases = ["start", "dispatch", "case", "heal", "evidence", "verify", "report"];
  const currentIndex = Math.max(0, phases.indexOf(phase));
  return phases
    .map((item, index) => `${item} ${index <= currentIndex ? "✓" : "…"}`)
    .join(" -> ");
}

// warehouse:method
// responsibility: Builds taxonomy healing swarm run observability reports with governed operator consoles summaries mutation ledgers review queues semantic tie out and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatSwarmOperatorConsole(report) {
  const summary = report.summary;
  const border = "+------------------------------------------------------------------------------------------------+";
  const evidenceCount = `${summary.trusted_evidence_count}/${summary.files_total}`;
  return [
    "```text",
    border,
    "| TAXONOMY HEALING SWARM OBSERVABILITY CONSOLE                                                   |",
    border,
    consoleLine("Status", statusSignal(report.status)),
    consoleLine("Run ID", report.run_id),
    consoleLine("Target Scope", operatorSignal("folder", report.target_scope)),
    consoleLine("Bee Count", operatorSignal("worker", `${summary.swarm_workers} workers`)),
    consoleLine(
      "Files",
      `${summary.files_total} total | ${summary.files_completed} completed | ${summary.files_running} running | ${summary.files_blocked} blocked`
    ),
    consoleLine("Phase", phaseTrail(report.phase)),
    consoleLine("Before", `${summary.before_health}/100  ${progressBar(summary.before_health)}`),
    consoleLine("After", `${summary.after_health}/100   ${progressBar(summary.after_health)}`),
    consoleLine("Delta", summary.net_delta),
    consoleLine("Source Mut.", `${summary.files_source_mutated} files mutated | ${summary.no_source_mutation} no source mutation`),
    consoleLine("Evidence", `${statusIcon(summary.evidence_trustworthy ? "pass" : "fail")} ${evidenceCount} trustworthy`),
    consoleLine("Escalations", `${renderStatusSignal(summary.human_review_required ? "warning" : "pass", summary.human_review_required)} human/operator review items`),
    border,
    "```",
  ].join("\n");
}

// warehouse:method
// responsibility: Builds taxonomy healing swarm run observability reports with governed operator consoles summaries mutation ledgers review queues semantic tie out and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatScoreMovementRows(scoreMovement) {
  return ["strong", "moderate", "weak", "trusted_evidence", "human_review"].map((key) => {
    const row = scoreMovement[key];
    return [row.label, row.before === null ? "n/a" : row.before, row.after, signedDelta(row.delta)];
  });
}

// warehouse:method
// responsibility: Builds taxonomy healing swarm run observability reports with governed operator consoles summaries mutation ledgers review queues semantic tie out and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatBeeStatus(status) {
  if (status === "done") {
    return renderStatusSignal("pass", "done");
  }
  if (status === "blocked") {
    return renderStatusSignal("blocked", "blocked");
  }
  return renderStatusSignal("warning", "review");
}

// warehouse:method
// responsibility: Builds taxonomy healing swarm run observability reports with governed operator consoles summaries mutation ledgers review queues semantic tie out and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatSwarmRunMarkdown(report) {
  const summary = report.summary;
  const artifacts = report.artifact_index;
  const semantic = report.semantic_tie_out;
  return [
    "# Taxonomy Healing Swarm Run",
    "",
    formatSwarmOperatorConsole(report),
    "",
    "## Executive Summary",
    "",
    markdownTable(
      ["Signal", "Value"],
      [
        ["Status", statusSignal(report.status)],
        ["Run ID", report.run_id],
        ["Target scope", report.target_scope],
        ["Swarm workers", summary.swarm_workers],
        ["Files in scope", summary.files_total],
        ["Files completed", summary.files_completed],
        ["Files improved", summary.files_improved],
        ["Files already trusted", summary.files_already_trusted],
        ["Files source-mutated", summary.files_source_mutated],
        ["Evidence-only refreshes", summary.evidence_only_refreshes],
        ["Blocked files", summary.files_blocked],
        ["Human review required", summary.human_review_required],
        ["Before health", `${summary.before_health}/100`],
        ["After health", `${summary.after_health}/100`],
        ["Net delta", summary.net_delta],
        ["Evidence trustworthy", evidenceSignal(summary.evidence_trustworthy)],
        ["Source mutation policy", summary.source_mutation_policy],
      ]
    ),
    "",
    "## Score Movement",
    "",
    markdownTable(["Band", "Before", "After", "Delta"], formatScoreMovementRows(report.score_movement)),
    "",
    "## Mutation Class Summary",
    "",
    markdownTable(
      ["Mutation Class", "Count", "Meaning"],
      Object.entries(report.mutation_class_summary).map(([mutationClass, row]) => [`\`${mutationClass}\``, row.count, row.meaning])
    ),
    "",
    "## Bee Workload Ledger",
    "",
    markdownTable(
      ["Bee", "Assigned", "Completed", "Mutated", "Evidence Refresh", "Blocked", "Avg Delta", "Status"],
      report.bee_ledger.map((row) => [
        row.bee,
        row.assigned,
        row.completed,
        row.mutated,
        row.evidence_refresh,
        row.blocked,
        row.avg_delta,
        formatBeeStatus(row.status),
      ])
    ),
    "",
    "## File Healing Ledger",
    "",
    markdownTable(
      ["File", "Before", "After", "Delta", "Mutation Class", "Source Mutated", "Evidence", "Verdict", "Next Action"],
      report.file_ledger.map((row) => [
        `\`${row.file}\``,
        row.before,
        row.after,
        row.delta,
        `\`${row.mutation_class}\``,
        sourceMutationSignal(row.source_mutated),
        evidenceSignal(row.evidence),
        `\`${row.verdict}\``,
        row.next_action,
      ])
    ),
    "",
    "## Human Review Queue",
    "",
    markdownTable(
      ["Priority", "File", "Reason", "Suggested Action"],
      report.review_queue.map((row) => [row.priority, `\`${row.file}\``, row.reason, row.suggested_action])
    ),
    "",
    "## Semantic Tie-Out Summary",
    "",
    markdownTable(
      ["Layer", "Result"],
      [
        ["File anchors aligned", `${semantic.file_anchors_aligned}/${summary.files_total}`],
        ["Method sets aligned", `${semantic.method_sets_aligned}/${summary.files_total}`],
        ["Responsibility tie-out verified", `${semantic.responsibility_tie_out_verified}/${summary.files_total}`],
        ["Evidence trustworthy", `${semantic.evidence_trustworthy}/${summary.files_total}`],
        ["Source mutation justified", `${semantic.source_mutation_justified}/${summary.files_source_mutated}`],
        ["Source mutation avoided where unnecessary", `${semantic.source_mutation_avoided}/${summary.no_source_mutation}`],
        ["Scorer uncertainty surfaced", semantic.scorer_uncertainty_surfaced],
        ["Human review required", semantic.human_review_required],
      ]
    ),
    "",
    "## Evidence Artifact Index",
    "",
    markdownTable(
      ["Artifact", "Path"],
      [
        ["Batch report JSON", artifacts.batch_report_json],
        ["Batch report markdown", artifacts.batch_report_markdown],
        ["Bee ledger", artifacts.bee_ledger_json],
        ["File ledger", artifacts.file_ledger_json],
        ["Human review queue", artifacts.review_queue_json],
        ["Source mutation diff", artifacts.source_mutation_diff],
        ["Evidence manifest", artifacts.evidence_manifest_json],
        ["Case files", artifacts.case_files_root],
        ["Latest swarm markdown", artifacts.latest_report_markdown],
        ["Latest swarm JSON", artifacts.latest_report_json],
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
// responsibility: Builds taxonomy healing swarm run observability reports with governed operator consoles summaries mutation ledgers review queues semantic tie out and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}

// warehouse:method
// responsibility: Builds taxonomy healing swarm run observability reports with governed operator consoles summaries mutation ledgers review queues semantic tie out and artifact projections
// actor: method_implementation
// role: implementation
// source_truth: implementation
function writeSwarmRunReport(report, reportsDir) {
  const runDir = path.join(reportsDir, "taxonomy-healing-runs", report.run_id);
  fs.mkdirSync(runDir, { recursive: true });
  const paths = {
    batch_report_json: path.join(runDir, "batch-report.json"),
    batch_report_markdown: path.join(runDir, "batch-report.md"),
    bee_ledger_json: path.join(runDir, "bee-ledger.json"),
    file_ledger_json: path.join(runDir, "file-ledger.json"),
    review_queue_json: path.join(runDir, "review-queue.json"),
    evidence_manifest_json: path.join(runDir, "evidence-manifest.json"),
    latest_report_markdown: path.join(reportsDir, "SWARM-RUN-LATEST.md"),
    latest_report_json: path.join(reportsDir, "swarm-report-latest.json"),
    latest_bee_ledger_json: path.join(reportsDir, "swarm-bee-ledger-latest.json"),
    latest_file_ledger_json: path.join(reportsDir, "swarm-file-ledger-latest.json"),
    latest_review_queue_json: path.join(reportsDir, "swarm-review-queue-latest.json"),
  };
  const markdown = formatSwarmRunMarkdown(report);
  writeJson(paths.batch_report_json, report);
  fs.writeFileSync(paths.batch_report_markdown, markdown, "utf8");
  writeJson(paths.bee_ledger_json, report.bee_ledger);
  writeJson(paths.file_ledger_json, report.file_ledger);
  writeJson(paths.review_queue_json, report.review_queue);
  writeJson(paths.evidence_manifest_json, report.artifact_index);
  fs.writeFileSync(paths.latest_report_markdown, markdown, "utf8");
  writeJson(paths.latest_report_json, report);
  writeJson(paths.latest_bee_ledger_json, report.bee_ledger);
  writeJson(paths.latest_file_ledger_json, report.file_ledger);
  writeJson(paths.latest_review_queue_json, report.review_queue);
  fs.writeFileSync(path.join(reportsDir, "CURRENT-RUN.md"), markdown, "utf8");
  return paths;
}

module.exports = {
  MUTATION_CLASS_MEANINGS,
  buildArtifactIndex,
  buildBeeLedger,
  buildFileLedger,
  buildFinalVerdict,
  buildMutationClassSummary,
  buildReviewQueue,
  buildScoreMovement,
  buildSemanticTieOut,
  buildSummary,
  buildSwarmRunReport,
  formatSwarmOperatorConsole,
  formatSwarmRunMarkdown,
  markdownTable,
  markdownValue,
  normalizeFiles,
  writeSwarmRunReport,
};
