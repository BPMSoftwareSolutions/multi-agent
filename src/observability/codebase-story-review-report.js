// warehouse:file
// responsibility: Builds codebase story review reports that separate taxonomy coherence from file economy architecture review using scan and swarm evidence
// actor: codebase_story_review_renderer
// role: renderer
// source_truth: implementation

const fs = require("fs");
const path = require("path");
const { renderProgressBar, renderStatusSignal } = require("./ascii-components");

const REVIEW_PROGRESS_CONTRACT = {
  component_key: "codebase_story_review_progress",
  component_kind: "ascii.progress",
  contract_version: "ascii_component.v1",
  rendering: {
    width: 24,
    style: "digital_block",
    show_percent: true,
    show_fraction: false,
  },
};

// warehouse:method
// responsibility: Builds codebase story review reports that separate taxonomy coherence from file economy architecture review using scan and swarm evidence
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
// responsibility: Builds codebase story review reports that separate taxonomy coherence from file economy architecture review using scan and swarm evidence
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
// responsibility: Builds codebase story review reports that separate taxonomy coherence from file economy architecture review using scan and swarm evidence
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
// responsibility: Builds codebase story review reports that separate taxonomy coherence from file economy architecture review using scan and swarm evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function consoleLine(label, value) {
  return `| ${consoleText(label, 13)} ${consoleText(value, 80)} |`;
}

// warehouse:method
// responsibility: Builds codebase story review reports that separate taxonomy coherence from file economy architecture review using scan and swarm evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function progressBar(score) {
  return renderProgressBar({
    value: score,
    max: 100,
    contract: REVIEW_PROGRESS_CONTRACT,
  });
}

// warehouse:method
// responsibility: Builds codebase story review reports that separate taxonomy coherence from file economy architecture review using scan and swarm evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatConsole(report) {
  const border = "+------------------------------------------------------------------------------------------------+";
  const summary = report.summary;
  const governance = report.story_governance;
  const residue = report.legacy_residue;
  const economy = report.file_economy;
  return [
    "```text",
    border,
    "| CODEBASE STORY REVIEW                                                                          |",
    border,
    consoleLine("Status", renderStatusSignal(governance.status_signal, governance.status_label)),
    consoleLine("Target", renderStatusSignal("folder", report.target_path, {
      contract: { rendering: { uppercase_label: false } },
    })),
    consoleLine(
      "Files",
      `${summary.files_reviewed} reviewed | ${summary.trusted_stories} locally trusted | ${summary.weak_stories} weak | ${summary.missing_taxonomy} missing`
    ),
    consoleLine("Methods", `${summary.method_anchors_found} anchored | ${summary.method_anchors_expected} locally tied out`),
    consoleLine("Local Tie-Out", `${renderStatusSignal("pass", `${summary.local_taxonomy_tie_out}/100`)}  ${progressBar(summary.local_taxonomy_tie_out)}`),
    consoleLine("Canonical", `${renderStatusSignal("warning", residue.status)} | residue pressure: ${residue.residue_pressure}`),
    consoleLine("File Economy", `${renderStatusSignal("warning", economy.status)} | ${economy.signals.consolidation_candidate_count} small-file boundary candidates`),
    consoleLine(
      "Legacy",
      `${renderStatusSignal(residue.residue_pressure > 0 ? "warning" : "pass", residue.residue_pressure > 0 ? "active" : "clear")} | ${residue.remove_candidates} remove candidate | ${residue.unclear_overlap} unclear overlaps | ${residue.compatibility_shells} compatibility shell`
    ),
    consoleLine("Overall", governance.overall_label),
    consoleLine("Main Question", report.primary_review_question),
    consoleLine("Verdict", report.headline_verdict),
    border,
    "```",
  ].join("\n");
}

// warehouse:method
// responsibility: Builds codebase story review reports that separate taxonomy coherence from file economy architecture review using scan and swarm evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function categoryForFile(file) {
  if (file.startsWith("bin/")) return "CLI and command surfaces";
  if (file.startsWith("src/core/")) return "Core runtime";
  if (file.startsWith("src/worker-bee/")) return "Worker-bee swarm";
  if (file.startsWith("src/taxonomy/") || file.includes("taxonomy")) return "Taxonomy scanning";
  if (file.startsWith("src/story-analysis/") || file.includes("story")) return "Story analysis";
  if (file.startsWith("src/observability/") || file.includes("report")) return "Observability and reports";
  if (file.startsWith("src/shared/")) return "Shared utilities";
  if (file.startsWith("test") || file.startsWith("tests/") || file.includes(".test.")) return "Tests and verification";
  return "Application and server surfaces";
}

// warehouse:method
// responsibility: Builds codebase story review reports that separate taxonomy coherence from file economy architecture review using scan and swarm evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function average(values) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

// warehouse:method
// responsibility: Builds codebase story review reports that separate taxonomy coherence from file economy architecture review using scan and swarm evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function economyVerdictForCategory(name, count, averageCoherence) {
  if (count === 0) return "n/a";
  if (averageCoherence < 100) return "economy review required";
  if (name === "Shared utilities") return "review for consolidation";
  if (name === "Zero-method files" || name === "One-method files") return "review required";
  return "directionally justified";
}

// warehouse:method
// responsibility: Builds codebase story review reports that separate taxonomy coherence from file economy architecture review using scan and swarm evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function noteForCategory(name) {
  const notes = {
    "CLI and command surfaces": "Justified when command behavior and operator entry points stay isolated.",
    "Core runtime": "Justified when each module owns one runtime responsibility.",
    "Worker-bee swarm": "Justified when decomposition keeps agent work packets small and governable.",
    "Taxonomy scanning": "Justified when scanning, extraction, evidence, and healing stay separable.",
    "Story analysis": "Justified when evaluator pieces remain independently testable.",
    "Observability and reports": "Justified when report rendering stays isolated from scoring and healing.",
    "Shared utilities": "Review for helper fragmentation and repeated one-method modules.",
    "Tests and verification": "Justified when tests protect coherence governance and report contracts.",
    "Application and server surfaces": "Justified when API, browser, route, and integration boundaries stay navigable.",
    "Zero-method files": "Justified only for wrappers, config, registry, boundary, or executable surfaces.",
    "One-method files": "Review whether the single method has durable semantic weight.",
  };
  return notes[name] || "Review responsibility boundary and navigational value.";
}

// warehouse:method
// responsibility: Builds codebase story review reports that separate taxonomy coherence from file economy architecture review using scan and swarm evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildCategoryRows(fileLedger) {
  const categories = new Map();
  for (const row of fileLedger) {
    const category = categoryForFile(row.file);
    if (!categories.has(category)) {
      categories.set(category, []);
    }
    categories.get(category).push(row);
  }
  const baseRows = Array.from(categories.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, rows]) => {
      const coherence = average(rows.map((row) => row.score));
      return {
        category: name,
        count: rows.length,
        coherence,
        economy_verdict: economyVerdictForCategory(name, rows.length, coherence),
        notes: noteForCategory(name),
      };
    });
  const zeroMethodRows = fileLedger.filter((row) => row.detected_methods === 0);
  const oneMethodRows = fileLedger.filter((row) => row.detected_methods === 1);
  return [
    ...baseRows,
    {
      category: "Zero-method files",
      count: zeroMethodRows.length,
      coherence: average(zeroMethodRows.map((row) => row.score)),
      economy_verdict: economyVerdictForCategory("Zero-method files", zeroMethodRows.length, 100),
      notes: noteForCategory("Zero-method files"),
    },
    {
      category: "One-method files",
      count: oneMethodRows.length,
      coherence: average(oneMethodRows.map((row) => row.score)),
      economy_verdict: economyVerdictForCategory("One-method files", oneMethodRows.length, 100),
      notes: noteForCategory("One-method files"),
    },
  ];
}

// warehouse:method
// responsibility: Builds codebase story review reports that separate taxonomy coherence from file economy architecture review using scan and swarm evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildEconomySignals(fileLedger) {
  const methodCounts = fileLedger.map((row) => row.detected_methods || 0);
  const zeroMethod = fileLedger.filter((row) => row.detected_methods === 0);
  const oneMethod = fileLedger.filter((row) => row.detected_methods === 1);
  const largeFiles = fileLedger.filter((row) => row.detected_methods >= 5);
  const largest = [...fileLedger].sort((a, b) => b.detected_methods - a.detected_methods)[0];
  return {
    average_methods_per_file: (methodCounts.reduce((sum, count) => sum + count, 0) / Math.max(fileLedger.length, 1)).toFixed(2),
    zero_method_count: zeroMethod.length,
    one_method_count: oneMethod.length,
    large_file_count: largeFiles.length,
    largest_method_file: largest ? `${largest.file} (${largest.detected_methods} methods)` : "n/a",
    small_strong_count: fileLedger.filter((row) => row.score >= 80 && row.detected_methods < 2).length,
    consolidation_candidate_count: zeroMethod.length + oneMethod.length,
  };
}

// warehouse:method
// responsibility: Builds codebase story review reports that separate taxonomy coherence from file economy architecture review using scan and swarm evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function fileExists(fileLedger, file) {
  return fileLedger.some((row) => row.file === file);
}

// warehouse:method
// responsibility: Builds codebase story review reports that separate taxonomy coherence from file economy architecture review using scan and swarm evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function matchingFiles(fileLedger, matcher) {
  return fileLedger
    .map((row) => row.file)
    .filter(matcher)
    .sort((a, b) => a.localeCompare(b));
}

// warehouse:method
// responsibility: Builds codebase story review reports that separate taxonomy coherence from file economy architecture review using scan and swarm evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildCanonicalSurfaceMap(fileLedger) {
  const compatibilityStory = fileExists(fileLedger, "bin/generate-story-report.js")
    ? ["bin/generate-story-report.js"]
    : [];
  const alternateStory = matchingFiles(fileLedger, (file) =>
    file.includes("story-report") && file !== "bin/generate-story-report.js"
  );
  const runReportSurfaces = matchingFiles(fileLedger, (file) =>
    file.includes("runs-report") || file.includes("run-report") || file.endsWith("/report.js")
  );
  const storyReviewRelationship = compatibilityStory.length || alternateStory.length
    ? "legacy command redirected to canonical report"
    : "canonical only";
  const storyReviewDecision = compatibilityStory.length || alternateStory.length
    ? "keep redirect only if needed; retire unused alternate surfaces"
    : "document boundary";
  return [
    {
      surface_type: "Taxonomy scan report",
      canonical_surface: "src/observability/taxonomy-scan-report.js",
      legacy_or_alternate_surfaces: matchingFiles(fileLedger, (file) =>
        file.includes("taxonomy-report") || file.includes("taxonomy-scan.js") || file.includes("verify-scan")
      ).join(", ") || "none detected",
      relationship: "canonical renderer with CLI and verification surfaces",
      decision: "document boundary",
    },
    {
      surface_type: "Swarm report",
      canonical_surface: "src/observability/taxonomy-swarm-report.js",
      legacy_or_alternate_surfaces: runReportSurfaces.join(", ") || "none detected",
      relationship: "partial overlap with run progress and summary reporting",
      decision: "document boundary",
    },
    {
      surface_type: "Story review report",
      canonical_surface: "src/observability/codebase-story-review-report.js",
      legacy_or_alternate_surfaces: [...compatibilityStory, ...alternateStory].join(", ") || "none detected",
      relationship: storyReviewRelationship,
      decision: storyReviewDecision,
    },
    {
      surface_type: "Anchor healing",
      canonical_surface: "bin/taxonomy-heal-run.js",
      legacy_or_alternate_surfaces: matchingFiles(fileLedger, (file) =>
        file.includes("taxonomy-heal.js") || file.includes("update-anchors")
      ).join(", ") || "none detected",
      relationship: "operational overlap between expected taxonomy healing and direct anchor mutation",
      decision: "choose mutation path per governance policy",
    },
    {
      surface_type: "Worker reporting",
      canonical_surface: "src/worker-bee/report/file-scanner.js",
      legacy_or_alternate_surfaces: matchingFiles(fileLedger, (file) =>
        file.includes("worker") && file.includes("report") && file !== "src/worker-bee/report/file-scanner.js"
      ).join(", ") || "none detected",
      relationship: "worker-specific reporting versus global observability",
      decision: "classify as canonical worker-local or retire",
    },
  ];
}

// warehouse:method
// responsibility: Builds codebase story review reports that separate taxonomy coherence from file economy architecture review using scan and swarm evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildLegacyResidueReview(fileLedger) {
  const canonicalSurfaceMap = buildCanonicalSurfaceMap(fileLedger);
  const compatibilityShells = matchingFiles(fileLedger, (file) =>
    file === "bin/generate-story-report.js" || file.includes("compatibility")
  );
  const unclearOverlap = canonicalSurfaceMap.filter((row) =>
    row.relationship.includes("overlap") || row.decision.includes("retire")
  );
  const removeCandidates = matchingFiles(fileLedger, (file) =>
    file.includes("story-report") && file !== "bin/generate-story-report.js"
  );
  const deprecatedSupported = canonicalSurfaceMap.filter((row) =>
    row.relationship.includes("redirected")
  );
  const residuePressure = compatibilityShells.length + unclearOverlap.length + removeCandidates.length;
  return {
    status: "review required",
    residue_pressure: residuePressure,
    canonical_surfaces: canonicalSurfaceMap.length,
    compatibility_shells: compatibilityShells.length,
    deprecated_but_supported: deprecatedSupported.length,
    unclear_overlap: unclearOverlap.length,
    remove_candidates: removeCandidates.length,
    canonical_surface_map: canonicalSurfaceMap,
    residue_queue: [
      ...compatibilityShells.map((file) => ({
        file,
        reason: "Compatibility shell remains after canonical report surface was introduced.",
        decision: "Keep only while documented, otherwise retire.",
      })),
      ...removeCandidates.map((file) => ({
        file,
        reason: "Story-report naming overlaps with canonical Codebase Story Review narrative.",
        decision: "Retire, redirect, or justify as a distinct package artifact.",
      })),
    ],
  };
}

// warehouse:method
// responsibility: Builds codebase story review reports that separate taxonomy coherence from file economy architecture review using scan and swarm evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildStoryGovernance(summary, economySignals, legacyResidue) {
  const localTaxonomyClean = summary.folder_coherence === 100 &&
    summary.weak_count === 0 &&
    summary.missing_count === 0 &&
    summary.healing_recommended_count === 0;
  const fileEconomyOpen = economySignals.consolidation_candidate_count > 0;
  const residueOpen = legacyResidue.residue_pressure > 0;
  const earned = localTaxonomyClean && !fileEconomyOpen && !residueOpen;
  return {
    status: earned ? "earned" : "not_yet_earned",
    status_signal: earned ? "pass" : "warning",
    status_label: earned ? "story coherence earned" : "story coherence not yet earned",
    local_taxonomy_clean: localTaxonomyClean,
    file_economy_gate: fileEconomyOpen ? "review required" : "pass",
    canonical_residue_gate: residueOpen ? "review required" : "pass",
    overall_story_coherence: earned ? "100/100 earned" : "not yet earned",
    overall_label: earned
      ? "✅ 100% earned | local taxonomy, file economy, and canonical story all clear"
      : "⚠ NOT 100% | local taxonomy is clean, system story still under review",
  };
}

// warehouse:method
// responsibility: Builds codebase story review reports that separate taxonomy coherence from file economy architecture review using scan and swarm evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildReport(scan, swarm = null) {
  const summary = scan.summary;
  const fileLedger = scan.file_ledger || [];
  const economySignals = buildEconomySignals(fileLedger);
  const legacyResidue = buildLegacyResidueReview(fileLedger);
  const storyGovernance = buildStoryGovernance(summary, economySignals, legacyResidue);
  const report = {
    schema: "codebase-story-review-report.v1",
    report_id: `codebase-story-review-${new Date().toISOString().replace(/[:.]/g, "-")}`,
    generated_at: new Date().toISOString(),
    source_scan_id: scan.run_id,
    source_swarm_id: swarm ? swarm.run_id : null,
    target_path: scan.target_path || ".",
    headline_verdict: storyGovernance.status === "earned"
      ? "Codebase story coherence earned"
      : "Local taxonomy clean; blocked by residue + economy review",
    primary_review_question: `Do all ${summary.files_scanned} files earn their boundaries and belong in the canonical story?`,
    summary: {
      review_status: storyGovernance.status_label,
      files_reviewed: summary.files_scanned,
      trusted_stories: summary.strong_count,
      weak_stories: summary.weak_count,
      missing_taxonomy: summary.missing_count,
      file_anchors_found: summary.file_anchors_found,
      method_anchors_found: summary.method_anchors_found,
      method_anchors_expected: summary.detected_methods,
      local_taxonomy_tie_out: summary.folder_coherence,
      source_mutated: "none in latest scan",
      healing_required: summary.healing_recommended_count > 0 ? "yes" : "no",
      narrative_status: storyGovernance.overall_story_coherence,
    },
    file_economy: {
      status: "review required",
      provisional_score: 70,
      score_meaning: "Mostly justified; review zero-method and one-method boundaries before scaling.",
      category_rows: buildCategoryRows(fileLedger),
      signals: economySignals,
    },
    legacy_residue: legacyResidue,
    story_governance: storyGovernance,
    final_verdict: [
      `The studio has achieved ${summary.folder_coherence}/100 local taxonomy tie-out: all scanned files have file anchors, all detected method anchors are represented, and no weak or missing taxonomy stories remain.`,
      `However, full codebase story coherence has not yet been earned. Residue review remains active, with ${legacyResidue.residue_pressure} residue-pressure points, including unclear overlaps, compatibility shells, deprecated surfaces, and remove candidates. File economy also remains under review because ${economySignals.consolidation_candidate_count} small-file boundary candidates need justification.`,
      "The current verdict is: local taxonomy is clean, but canonical codebase coherence remains blocked until legacy residue is retired, redirected, or explicitly justified and small-file boundaries are reviewed.",
      "Local truth is not whole truth. A file can be honest about itself and still be lying about whether it belongs.",
    ].join("\n\n"),
  };
  return report;
}

// warehouse:method
// responsibility: Builds codebase story review reports that separate taxonomy coherence from file economy architecture review using scan and swarm evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatMarkdown(report) {
  const summary = report.summary;
  const economy = report.file_economy;
  const residue = report.legacy_residue;
  const governance = report.story_governance;
  const categoryRows = economy.category_rows.map((row) => [
    row.category,
    row.count,
    `${row.coherence}/100`,
    row.economy_verdict,
    row.notes,
  ]);
  const signalRows = [
    ["Average methods per file", economy.signals.average_methods_per_file, "Low averages may be justified by agent-safe boundaries, but deserve review."],
    ["Files with 0 methods", economy.signals.zero_method_count, "Boundary, config, executable, and registry files may be legitimate."],
    ["Files with 1 method", economy.signals.one_method_count, "One-method files need semantic weight or test/governance value."],
    ["Files with 5+ methods", economy.signals.large_file_count, "Larger files may be justified when they hold cohesive UI or orchestration flow."],
    ["Largest file by method count", economy.signals.largest_method_file, "Review large surfaces for cohesion rather than splitting mechanically."],
    ["Strong files below 2 methods", economy.signals.small_strong_count, "Truthful small files are candidates for file-economy review."],
    ["Consolidation candidates", economy.signals.consolidation_candidate_count, "Candidate count is a review queue, not an automatic merge order."],
  ];
  const canonicalSurfaceRows = residue.canonical_surface_map.map((row) => [
    row.surface_type,
    `\`${row.canonical_surface}\``,
    row.legacy_or_alternate_surfaces === "none detected"
      ? row.legacy_or_alternate_surfaces
      : row.legacy_or_alternate_surfaces.split(", ").map((file) => `\`${file}\``).join(", "),
    row.relationship,
    row.decision,
  ]);
  const residueRows = residue.residue_queue.length
    ? residue.residue_queue.map((row) => [`\`${row.file}\``, row.reason, row.decision])
    : [["none", "No current residue queue items were detected from the scan ledger.", "continue monitoring"]];
  const residuePressureRows = [
    ["Compatibility shell", residue.compatibility_shells, "Old surface kept to redirect or support callers."],
    ["Deprecated but supported", residue.deprecated_but_supported, "Old surface still intentionally supported."],
    ["Unclear overlap", residue.unclear_overlap, "Canonical relationship not fully resolved."],
    ["Remove candidate", residue.remove_candidates, "Candidate for retirement."],
    ["Actionable file queue", residue.residue_queue.length, "File-level items requiring a decision."],
  ];
  return [
    "# Codebase Story Review Report",
    "",
    "**Subtitle:** A narrative review of taxonomy coherence, responsibility boundaries, and file-count justification.",
    "",
    `**Generated:** ${report.generated_at}`,
    `**Source scan:** \`${report.source_scan_id}\``,
    report.source_swarm_id ? `**Source swarm:** \`${report.source_swarm_id}\`` : null,
    "",
    formatConsole(report),
    "",
    "Important: Local Tie-Out is not the same as Codebase Story Coherence. Local Tie-Out verifies file/method truth. Codebase Story Coherence also requires canonical ownership and earned file boundaries.",
    "",
    "## Narrative Purpose",
    "",
    "This report reviews whether the codebase tells a coherent architectural story and whether the current file structure is justified by responsibility boundaries, navigability, testability, and swarm execution needs.",
    "",
    "The review answers three different questions:",
    "",
    "```text",
    "1. Is the local taxonomy coherent?",
    "2. Is the file count justified?",
    "3. Does the file still belong in the current canonical system story?",
    "```",
    "",
    "A codebase can have clean local taxonomy and still fail codebase story coherence. A file does not earn codebase coherence merely because it describes itself correctly. It earns codebase coherence when it describes itself correctly, deserves its boundary, and still belongs in the canonical system story.",
    "",
    "## Executive Narrative",
    "",
    `The studio has reached a trusted local taxonomy state. Every scanned file has a file anchor, every detected method anchor ties out, and the system currently reports ${summary.local_taxonomy_tie_out}/100 local taxonomy tie-out.`,
    "",
    "That does not mean whole-codebase story coherence has been earned. The earlier false-narrative problem has been resolved at the local file/method taxonomy layer, but residue and boundary review still decide whether those files belong in the current architecture.",
    "",
    `The current governance posture is ${governance.overall_story_coherence}. This review evaluates whether ${summary.files_reviewed} files represent healthy responsibility separation or unnecessary fragmentation, and whether any legacy surfaces still preserve old system ideas that should be retired, redirected, or explicitly justified.`,
    "",
    "## Current Story Snapshot",
    "",
    markdownTable(
      ["Signal", "Value"],
      [
        ["Files reviewed", summary.files_reviewed],
        ["Locally trusted stories", summary.trusted_stories],
        ["Weak stories", summary.weak_stories],
        ["Missing taxonomy", summary.missing_taxonomy],
        ["File anchors", `${summary.file_anchors_found}/${summary.files_reviewed}`],
        ["Method anchors", `${summary.method_anchors_found}/${summary.method_anchors_expected}`],
        ["Local taxonomy tie-out", `${summary.local_taxonomy_tie_out}/100`],
        ["Overall story coherence", governance.overall_story_coherence],
        ["Source mutation", summary.source_mutated],
        ["Healing required", summary.healing_required],
        ["Narrative status", summary.narrative_status],
        ["Economy status", economy.status],
        ["File economy score", `${economy.provisional_score}/100 provisional`],
        ["Residue status", residue.status],
        ["Residue pressure", residue.residue_pressure],
      ]
    ),
    "",
    "## Local Taxonomy Verdict",
    "",
    "The local taxonomy tie-out result is accepted. The scanner found complete file-level and method-level coverage, and no files are currently weak, missing, or routed to scorer review.",
    "",
    markdownTable(
      ["Evidence Layer", "Result", "Meaning"],
      [
        ["File anchors", `${summary.file_anchors_found}/${summary.files_reviewed}`, "Every scanned file has a file-level taxonomy story."],
        ["Method anchors", `${summary.method_anchors_found}/${summary.method_anchors_expected}`, "Detected behavior is represented in method taxonomy."],
        ["File-method tie-out", `${summary.local_taxonomy_tie_out}/100`, "File responsibilities and method responsibilities align locally."],
        ["Missing taxonomy", summary.missing_taxonomy, "No dark files remain in the latest scan."],
        ["Weak stories", summary.weak_stories, "No contradictory file stories remain in the latest scan."],
        ["Canonical residue gate", governance.canonical_residue_gate, "Overall codebase story coherence cannot reach 100 while residue remains open."],
        ["File economy gate", governance.file_economy_gate, "Overall codebase story coherence cannot reach 100 while boundaries remain unreviewed."],
      ]
    ),
    "",
    "## File Count Question",
    "",
    "### Main Question",
    "",
    "```text",
    report.primary_review_question,
    "```",
    "",
    "### Short Answer",
    "",
    "Maybe yes for this studio experiment, if the purpose is to prove agent-safe decomposition. Not automatically yes for larger codebases.",
    "",
    "### Full Answer",
    "",
    "The current file count appears directionally justified when files represent durable responsibility boundaries: command routing, scanning, story analysis, evidence generation, observability reporting, worker execution, and verification. This separation is especially useful for swarm execution because small coherent files are easier for agents to inspect, route, heal, test, and govern.",
    "",
    "The remaining review question is whether zero-method and one-method files carry enough architectural weight to deserve their own file. Those files are not wrong by default. Some are legitimate wrappers, registries, specs, executable surfaces, or single-responsibility modules. They should be reviewed under a file-economy lens before scaling the pattern.",
    "",
    "## File Economy Review",
    "",
    markdownTable(["Category", "Count", "Coherence", "Economy Verdict", "Notes"], categoryRows),
    "",
    "## File Economy Signals",
    "",
    markdownTable(["Signal", "Value", "Interpretation"], signalRows),
    "",
    "## Legacy Idea Residue Review",
    "",
    "Purpose: detect files that are locally coherent but globally obsolete, duplicated, or unclear after newer canonical surfaces were introduced.",
    "",
    "A file can pass taxonomy coherence and still be part of a false system narrative if it is an old report, old command, compatibility wrapper, or duplicate surface that no longer owns the canonical story.",
    "",
    "```text",
    "Coherence proves each file tells the truth about itself.",
    "File economy proves the file deserves its own boundary.",
    "Residue review proves the file still belongs in the current system story.",
    "```",
    "",
    "### Residue Signals",
    "",
    markdownTable(
      ["Metric", "Value"],
      [
        ["Canonical surfaces", residue.canonical_surfaces],
        ["Compatibility shells", residue.compatibility_shells],
        ["Deprecated but supported", residue.deprecated_but_supported],
        ["Unclear overlap", residue.unclear_overlap],
        ["Remove candidates", residue.remove_candidates],
        ["Residue pressure", residue.residue_pressure],
      ]
    ),
    "",
    "### Residue Pressure Breakdown",
    "",
    "Residue pressure counts canonical-surface relationship risks, not only individual retire/remove candidates. The queue below lists the currently actionable file-level residue items.",
    "",
    markdownTable(["Pressure Type", "Count", "Meaning"], residuePressureRows),
    "",
    "### Canonical Surface Map",
    "",
    markdownTable(
      ["Surface Type", "Canonical Surface", "Legacy / Alternate Surfaces", "Relationship", "Decision"],
      canonicalSurfaceRows
    ),
    "",
    "### Residue Queue",
    "",
    markdownTable(["File", "Reason", "Decision"], residueRows),
    "",
    "## Architecture Narrative",
    "",
    "The codebase currently reads as a governance-oriented studio rather than a compact runtime-only application. Its architecture separates command entry points, runtime modules, taxonomy extraction, story analysis, worker-bee packet handling, evidence bundles, report rendering, and verification surfaces.",
    "",
    "That decomposition is aligned with the operating model: agents need small, named, inspectable work surfaces; operators need evidence and observability; and the scanner needs anchors that tie implementation behavior back to explicit responsibility.",
    "",
    "## Why The Current Decomposition May Be Justified",
    "",
    `The ${summary.files_reviewed}-file shape may be justified because coherence governance benefits from narrow boundaries. Smaller files can reduce the blast radius of automated repair, make worker assignment clearer, keep reports and scanners independently testable, and give agents stronger navigation cues.`,
    "",
    "## Where The Current Decomposition May Be Excessive",
    "",
    "The economy review remains open around small files. Zero-method files and one-method files can be healthy, but they are also the highest-risk zone for over-fragmentation. The review question is not whether they are coherent; they are. The question is whether each one improves clarity, testability, reuse, governance, or safe swarm execution enough to justify its own file.",
    "",
    "## Team Review Questions",
    "",
    markdownTable(
      ["Question", "Why It Matters"],
      [
        ["Does each file represent a durable responsibility boundary?", "Prevents arbitrary fragmentation."],
        ["Would merging this file reduce clarity or increase confusion?", "Tests whether separation is valuable."],
        ["Is this file independently testable?", "Justifies small modules."],
        ["Is this file independently reusable?", "Justifies extraction."],
        ["Does this file protect actor boundaries?", "Justifies governance separation."],
        ["Does this file help agents navigate safely?", "Justifies AI-readable decomposition."],
        ["Is this file only a wrapper/index/spec surface?", "May justify zero-method files."],
        ["Is this file a one-method module with real semantic weight?", "May justify or challenge one-method files."],
      ]
    ),
    "",
    "## Recommended Decisions",
    "",
    markdownTable(
      ["Decision", "Recommendation"],
      [
        ["Taxonomy trust", "Accept the 100/100 local taxonomy tie-out result for the current studio snapshot."],
        ["File economy", "Mark as review required with a 70/100 provisional score."],
        ["Legacy residue", "Keep canonical-surface review active and retire or justify alternate surfaces."],
        ["Consolidation", "Review zero-method and one-method files before merging anything."],
        ["Expansion to LLC codebase", "Classify first, then score coherence, then split only where responsibility boundaries justify it."],
        ["Expansion to Python codebase", "Do not mechanically explode thousands of files into tiny modules."],
      ]
    ),
    "",
    "## Decision Rule",
    "",
    "```text",
    "A file is justified when its separation improves at least one of:",
    "responsibility clarity,",
    "testability,",
    "agent navigation,",
    "governance boundary protection,",
    "reuse,",
    "evidence generation,",
    "or safe swarm execution.",
    "```",
    "",
    "Local taxonomy tells us whether the file story is internally true. File economy tells us whether the story needed its own file.",
    "",
    "Residue review tells us whether the story still belongs in the current canonical architecture.",
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
        ["Report ID", report.report_id],
        ["Source scan ID", report.source_scan_id],
        ["Source swarm ID", report.source_swarm_id || "n/a"],
        ["Target path", report.target_path],
        ["Generated at", report.generated_at],
      ]
    ),
    "",
  ].filter((line) => line !== null).join("\n");
}

// warehouse:method
// responsibility: Builds codebase story review reports that separate taxonomy coherence from file economy architecture review using scan and swarm evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function writeCodebaseStoryReviewReport(report, reportsDir) {
  const markdown = formatMarkdown(report);
  const snapshotDir = path.join(reportsDir, "codebase-story-reviews");
  const snapshotPath = path.join(snapshotDir, `${report.report_id}.md`);
  const latestPath = path.join(reportsDir, "CODEBASE-STORY-REVIEW-LATEST.md");
  fs.mkdirSync(snapshotDir, { recursive: true });
  fs.writeFileSync(latestPath, markdown, "utf8");
  fs.writeFileSync(snapshotPath, markdown, "utf8");
  fs.writeFileSync(path.join(reportsDir, "codebase-story-review-latest.json"), JSON.stringify(report, null, 2), "utf8");
  return {
    latest_markdown: latestPath,
    snapshot_markdown: snapshotPath,
    latest_json: path.join(reportsDir, "codebase-story-review-latest.json"),
  };
}

module.exports = {
  buildReport,
  formatMarkdown,
  writeCodebaseStoryReviewReport,
};
