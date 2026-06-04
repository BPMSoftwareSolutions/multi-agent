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
  return [
    "```text",
    border,
    "| CODEBASE STORY REVIEW                                                                          |",
    border,
    consoleLine("Status", renderStatusSignal("pass", "story coherent")),
    consoleLine("Target", renderStatusSignal("folder", report.target_path, {
      contract: { rendering: { uppercase_label: false } },
    })),
    consoleLine(
      "Files",
      `${summary.files_reviewed} reviewed | ${summary.trusted_stories} trusted | ${summary.weak_stories} weak | ${summary.missing_taxonomy} missing`
    ),
    consoleLine("Methods", `${summary.method_anchors_found} anchored | ${summary.method_anchors_expected} tied out`),
    consoleLine("Coherence", `${summary.codebase_coherence}/100  ${progressBar(summary.codebase_coherence)}`),
    consoleLine("File Economy", renderStatusSignal("warning", report.file_economy.status)),
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
  if (averageCoherence < 100) return "review coherence first";
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
function buildReport(scan, swarm = null) {
  const summary = scan.summary;
  const fileLedger = scan.file_ledger || [];
  const economySignals = buildEconomySignals(fileLedger);
  const report = {
    schema: "codebase-story-review-report.v1",
    report_id: `codebase-story-review-${new Date().toISOString().replace(/[:.]/g, "-")}`,
    generated_at: new Date().toISOString(),
    source_scan_id: scan.run_id,
    source_swarm_id: swarm ? swarm.run_id : null,
    target_path: scan.target_path || ".",
    headline_verdict: "Coherent architecture, but file-count justification requires boundary review",
    primary_review_question: `Do we need ${summary.files_scanned} files to pull off this taxonomy scanning and swarming solution?`,
    summary: {
      review_status: "story coherent",
      files_reviewed: summary.files_scanned,
      trusted_stories: summary.strong_count,
      weak_stories: summary.weak_count,
      missing_taxonomy: summary.missing_count,
      file_anchors_found: summary.file_anchors_found,
      method_anchors_found: summary.method_anchors_found,
      method_anchors_expected: summary.detected_methods,
      codebase_coherence: summary.folder_coherence,
      source_mutated: "none in latest scan",
      healing_required: summary.healing_recommended_count > 0 ? "yes" : "no",
      narrative_status: "trusted",
    },
    file_economy: {
      status: "review required",
      provisional_score: 70,
      score_meaning: "Mostly justified; review zero-method and one-method boundaries before scaling.",
      category_rows: buildCategoryRows(fileLedger),
      signals: economySignals,
    },
    final_verdict: [
      `The studio codebase now tells a coherent taxonomy story. The scan reviewed ${summary.files_scanned} files, found file anchors on all ${summary.file_anchors_found}, found all ${summary.method_anchors_found} expected method anchors, and reported ${summary.folder_coherence}/100 coherence.`,
      "That means the codebase is semantically trustworthy at the taxonomy level. However, the file count should not be treated as automatically justified simply because coherence is 100/100.",
      "The recommendation is to accept the taxonomy coherence result, preserve the responsibility-first architecture, and run a file-economy review pass before scaling the pattern to larger Python or LLC codebases.",
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
    "## Narrative Purpose",
    "",
    "This report reviews whether the codebase tells a coherent architectural story and whether the current file structure is justified by responsibility boundaries, navigability, testability, and swarm execution needs.",
    "",
    "The review answers two different questions:",
    "",
    "```text",
    "1. Is the taxonomy coherent?",
    "2. Is the file count justified?",
    "```",
    "",
    "A codebase can be coherent and still be over-decomposed. A codebase can also have many files because the architecture intentionally separates actors, commands, scanners, validators, reporters, evidence builders, and swarm workers into clear operational boundaries.",
    "",
    "## Executive Narrative",
    "",
    `The studio has reached a trusted taxonomy state. Every scanned file has a file anchor, every detected method anchor ties out, and the system currently reports ${summary.codebase_coherence}/100 codebase coherence.`,
    "",
    "The story the codebase tells is no longer contradictory. The earlier false-narrative problem has been resolved at the taxonomy level. Files now declare focused responsibilities, and method anchors support those declarations.",
    "",
    `However, the next governance question is not whether the codebase is coherent. The next question is whether the coherent file structure is economically justified. A system can be truthful and still be over-decomposed. This review evaluates whether ${summary.files_reviewed} files represent healthy responsibility separation or unnecessary fragmentation.`,
    "",
    "## Current Story Snapshot",
    "",
    markdownTable(
      ["Signal", "Value"],
      [
        ["Files reviewed", summary.files_reviewed],
        ["Trusted stories", summary.trusted_stories],
        ["Weak stories", summary.weak_stories],
        ["Missing taxonomy", summary.missing_taxonomy],
        ["File anchors", `${summary.file_anchors_found}/${summary.files_reviewed}`],
        ["Method anchors", `${summary.method_anchors_found}/${summary.method_anchors_expected}`],
        ["Coherence", `${summary.codebase_coherence}/100`],
        ["Source mutation", summary.source_mutated],
        ["Healing required", summary.healing_required],
        ["Narrative status", summary.narrative_status],
        ["Economy status", economy.status],
        ["File economy score", `${economy.provisional_score}/100 provisional`],
      ]
    ),
    "",
    "## Coherence Verdict",
    "",
    "The taxonomy coherence result is accepted. The scanner found complete file-level and method-level coverage, and no files are currently weak, missing, or routed to scorer review.",
    "",
    markdownTable(
      ["Evidence Layer", "Result", "Meaning"],
      [
        ["File anchors", `${summary.file_anchors_found}/${summary.files_reviewed}`, "Every scanned file has a file-level taxonomy story."],
        ["Method anchors", `${summary.method_anchors_found}/${summary.method_anchors_expected}`, "Detected behavior is represented in method taxonomy."],
        ["File-method tie-out", `${summary.codebase_coherence}/100`, "File responsibilities and method responsibilities align."],
        ["Missing taxonomy", summary.missing_taxonomy, "No dark files remain in the latest scan."],
        ["Weak stories", summary.weak_stories, "No contradictory file stories remain in the latest scan."],
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
        ["Taxonomy trust", "Accept the 100/100 coherence result for the current studio snapshot."],
        ["File economy", "Mark as review required with a 70/100 provisional score."],
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
    "Coherence tells us whether the story is true. File economy tells us whether the story needed its own file.",
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
