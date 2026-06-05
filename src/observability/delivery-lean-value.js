// warehouse:file
// responsibility: Score delivery boundaries for lean value deterministically and derive disposition, quarantine, and retirement candidate views
// actor: delivery_report_renderer
// role: renderer
// source_truth: taxonomy/loc-delivery-chain.json

const fs = require("fs");
const path = require("path");
const { buildFileEvidence } = require("../../cli/taxonomy-evidence-bundle");

const SCAN_DIRS = ["cli", "src", "tests", "contracts", "taxonomy", "scripts", "packages"];
const SKIP_DIRS = new Set([".git", "node_modules", "reports", "test-results", ".studio"]);
const EVIDENCE_BY_ROLE = {
  source_of_truth: 20, contract: 20, verifier: 20, fixture: 18, renderer: 18,
  projection: 16, validator: 16, orchestrator: 16, loader: 14, packet: 14,
  entrypoint: 10, deferred_projection: 8,
};

// warehouse:method
// responsibility: List the repo source files (js and json) that could reference a delivery boundary, pruning noise directories
function listSourceFiles(repoRoot) {
  const out = [];
  const walk = (rel) => {
    const abs = path.join(repoRoot, rel);
    if (!fs.existsSync(abs)) return;
    for (const name of fs.readdirSync(abs)) {
      if (SKIP_DIRS.has(name)) continue;
      const childRel = rel ? `${rel}/${name}` : name;
      const stat = fs.statSync(path.join(repoRoot, childRel));
      if (stat.isDirectory()) walk(childRel);
      else if (name.endsWith(".js") || name.endsWith(".json")) out.push(childRel);
    }
  };
  for (const d of SCAN_DIRS) walk(d);
  return out;
}

// warehouse:method
// responsibility: Determine how a boundary file is referenced across requires, package scripts, and string paths
function scanUsage(repoRoot, rel, sourceFiles, pkgText) {
  const base = path.basename(rel);
  const targetAbs = path.join(repoRoot, rel);
  let requiredBy = 0;
  let stringRefBy = 0;
  const isJs = rel.endsWith(".js");
  for (const f of sourceFiles) {
    if (f === rel) continue;
    let text;
    try { text = fs.readFileSync(path.join(repoRoot, f), "utf8"); } catch (_e) { continue; }
    if (isJs) {
      const re = /require\(\s*["'](\.[^"']+)["']\s*\)/g;
      let m;
      while ((m = re.exec(text)) !== null) {
        const base2 = path.resolve(path.dirname(path.join(repoRoot, f)), m[1]);
        if ([base2, base2 + ".js", base2 + ".json"].some((c) => path.resolve(c) === targetAbs)) { requiredBy += 1; break; }
      }
    }
    if (text.includes(rel) || text.includes(base)) stringRefBy += 1;
  }
  const inPackageJson = pkgText.includes(rel) || pkgText.includes(base);
  const isTest = rel.startsWith("tests/") && !rel.includes("/fixtures/");
  return { requiredBy, stringRefBy, inPackageJson, isTest };
}

// warehouse:method
// responsibility: Score a single delivery boundary on the five value dimensions and classify its disposition deterministically
function scoreBoundary(repoRoot, boundary, sourceFiles, pkgText) {
  const rel = boundary.canonical_path;
  const exists = fs.existsSync(path.join(repoRoot, rel));
  const text = exists ? fs.readFileSync(path.join(repoRoot, rel), "utf8") : "";
  const lines = text ? text.split(/\r?\n/).length : 0;

  const hasStory = (boundary.story_links || []).length > 0;
  const hasAccept = (boundary.acceptance_links || []).length > 0;
  const userValueTrace = hasStory && hasAccept ? 30 : hasStory || hasAccept ? 20 : 0;

  let boundaryClarity = 20;
  if (rel.endsWith(".js") && exists) {
    const ev = buildFileEvidence(rel, repoRoot);
    const coh = ev.coherence ? ev.coherence.score : 0;
    boundaryClarity = Math.round((coh / 100) * 20);
  }

  const evidenceContribution = EVIDENCE_BY_ROLE[boundary.role] != null ? EVIDENCE_BY_ROLE[boundary.role] : 12;

  const usage = scanUsage(repoRoot, rel, sourceFiles, pkgText);
  const runtimeNecessity = usage.requiredBy > 0 || usage.inPackageJson || usage.isTest ? 15 : usage.stringRefBy > 0 ? 12 : 4;

  const maintenanceCostInverse = lines <= 120 ? 15 : lines <= 300 ? 12 : lines <= 600 ? 8 : 5;
  const maintenanceCostSignal = lines <= 120 ? "low" : lines <= 300 ? "low" : lines <= 600 ? "medium" : "high";

  const valueScore = userValueTrace + boundaryClarity + evidenceContribution + runtimeNecessity + maintenanceCostInverse;

  let runtimeUseSignal;
  let runtimeUseConfidence;
  if (usage.requiredBy > 0 || usage.inPackageJson || usage.isTest) { runtimeUseSignal = "used"; runtimeUseConfidence = "high"; }
  else if (usage.stringRefBy > 0) { runtimeUseSignal = "referenced_by_string"; runtimeUseConfidence = "medium"; }
  else { runtimeUseSignal = "unproven"; runtimeUseConfidence = "low"; }

  let visibility = "ok";
  if (runtimeUseSignal === "unproven") visibility = "unknown_runtime_use";
  else if (valueScore < 50) visibility = "low_value";
  else if (runtimeUseConfidence === "medium") visibility = "external_surface_possible";

  const valueScoreConfidence = runtimeUseConfidence;
  const confidenceReason =
    runtimeUseConfidence === "high" ? "runtime use proven via require, package script, or test surface"
      : runtimeUseConfidence === "medium" ? "only string-path references found; external surface possible"
        : "no caller, script, or string reference found; route to review before disposition";

  let disposition;
  let quarantineMode = "none";
  let reviewReason = "";
  if (runtimeUseSignal === "unproven") { disposition = "quarantine_candidate"; quarantineMode = "observe_only"; reviewReason = "runtime use not proven"; }
  else if (valueScore >= 75) disposition = "keep_high_value";
  else if (valueScore >= 55) disposition = "keep_watchlist";
  else if (boundary.role === "fixture") { disposition = "demotion_candidate"; quarantineMode = "test_fixture_only"; }
  else { disposition = "keep_watchlist"; reviewReason = "value below keep_high_value threshold"; }

  return {
    path: rel,
    boundary_id: boundary.boundary_id,
    story_links: boundary.story_links || [],
    exists,
    lines,
    dimensions: {
      user_value_trace: userValueTrace,
      boundary_clarity: boundaryClarity,
      evidence_contribution: evidenceContribution,
      runtime_necessity: runtimeNecessity,
      maintenance_cost_inverse: maintenanceCostInverse,
    },
    value_score: valueScore,
    value_score_confidence: valueScoreConfidence,
    confidence_reason: confidenceReason,
    maintenance_cost_signal: maintenanceCostSignal,
    runtime_use_signal: runtimeUseSignal,
    runtime_use_confidence: runtimeUseConfidence,
    canonical_overlap_signal: "none",
    value_visibility_finding: visibility,
    recommended_disposition: disposition,
    quarantine_mode: quarantineMode,
    retirement_evidence_status: "not_started",
    safe_to_remove: false,
    lean_delta_impact: valueScore,
    review_required_reason: reviewReason,
  };
}

// warehouse:method
// responsibility: Build the full lean value ledger and derived candidate and lean-delta views from the canonical chain
function buildLeanValue(chain, repoRoot) {
  const sourceFiles = listSourceFiles(repoRoot);
  const pkgText = fs.readFileSync(path.join(repoRoot, "package.json"), "utf8");
  const boundaries = (chain.delivery_boundaries || []).filter(
    (b) => !b.canonical_path.startsWith("reports/") && !b.canonical_path.endsWith("/")
  );
  const entries = boundaries.map((b) => scoreBoundary(repoRoot, b, sourceFiles, pkgText)).sort((a, b) => a.path.localeCompare(b.path));

  const byDisposition = {};
  for (const e of entries) byDisposition[e.recommended_disposition] = (byDisposition[e.recommended_disposition] || 0) + 1;
  const totalValue = entries.reduce((n, e) => n + e.value_score, 0);

  const ledger = {
    schema: "loc-delivery-value-ledger.v1",
    source_truth: "taxonomy/loc-delivery-chain.json",
    source_generated_at: chain.generated_at,
    summary: {
      scored_files: entries.length,
      total_value: totalValue,
      average_value: entries.length ? Math.round(totalValue / entries.length) : 0,
      by_disposition: byDisposition,
      low_value_count: entries.filter((e) => e.value_visibility_finding === "low_value").length,
      unknown_runtime_use_count: entries.filter((e) => e.value_visibility_finding === "unknown_runtime_use").length,
      review_required_count: entries.filter((e) => e.review_required_reason).length,
    },
    entries,
  };

  const quarantine = entries.filter((e) => e.recommended_disposition === "quarantine_candidate");
  const demotion = entries.filter((e) => e.recommended_disposition === "demotion_candidate");
  const removal = entries.filter((e) => e.recommended_disposition === "removal_candidate");

  const retirementEvidence = {
    schema: "loc-delivery-retirement-evidence.v1",
    source_generated_at: chain.generated_at,
    note: "No file may be removed until every scan passes and safe_to_remove is true. Default is false.",
    candidates: removal.map((e) => ({
      path: e.path,
      caller_scan: "pending", export_scan: "pending", script_reference_scan: "pending",
      test_reference_scan: "pending", doc_reference_scan: "pending", runtime_use_scan: "pending",
      generated_projection_scan: "pending", safe_to_remove: false,
    })),
  };

  const leanDelta = {
    schema: "loc-delivery-lean-delta.v1",
    source_generated_at: chain.generated_at,
    note: "Baseline scoring snapshot. No additions or removals this pass.",
    files_added: 0, files_removed: 0,
    value_present: totalValue,
    average_value: ledger.summary.average_value,
    maintenance_cost_high_files: entries.filter((e) => e.maintenance_cost_signal === "high").length,
    value_density: entries.length ? Math.round((totalValue / entries.length)) : 0,
    disposition_changes: [],
  };

  return { ledger, quarantine, demotion, retirementEvidence, leanDelta };
}

// warehouse:method
// responsibility: Render the human-readable lean value markdown from the ledger and candidate views
function buildLeanMarkdown(built) {
  const s = built.ledger.summary;
  const lines = [];
  lines.push("# LOC Delivery Lean Value", "");
  lines.push("> Read-only deterministic scoring. Recommendations are data, not actions. No file is removed or demoted without an approved packet and retirement evidence.", "");
  lines.push("## Summary", "");
  lines.push(`- Scored files: ${s.scored_files}  ·  Average value: ${s.average_value}/100  ·  Total: ${s.total_value}`);
  lines.push(`- Dispositions: ${Object.entries(s.by_disposition).map(([k, v]) => `${k}=${v}`).join(", ")}`);
  lines.push(`- low_value: ${s.low_value_count}  ·  unknown_runtime_use: ${s.unknown_runtime_use_count}  ·  review_required: ${s.review_required_count}`, "");
  lines.push("## Value Ledger", "", "| File | Value | Conf | Runtime | Finding | Disposition |", "| --- | ---: | --- | --- | --- | --- |");
  for (const e of built.ledger.entries) {
    lines.push(`| \`${e.path}\` | ${e.value_score} | ${e.value_score_confidence} | ${e.runtime_use_signal} | ${e.value_visibility_finding} | ${e.recommended_disposition} |`);
  }
  lines.push("");
  if (built.quarantine.length) {
    lines.push("## Quarantine Candidates", "");
    for (const e of built.quarantine) lines.push(`- \`${e.path}\` (${e.quarantine_mode}) — ${e.review_required_reason}`);
    lines.push("");
  }
  if (built.demotion.length) {
    lines.push("## Demotion Candidates", "");
    for (const e of built.demotion) lines.push(`- \`${e.path}\` (${e.quarantine_mode})`);
    lines.push("");
  }
  return lines.join("\n");
}

// warehouse:method
// responsibility: Write the lean value ledger, candidate, retirement, lean-delta, and markdown artifacts into reports
function writeLeanValue(reportsDir, built) {
  const latestDir = path.join(reportsDir, "loc-delivery-taxonomy", "latest");
  fs.mkdirSync(latestDir, { recursive: true });
  const w = (name, obj) => fs.writeFileSync(path.join(latestDir, name), JSON.stringify(obj, null, 2) + "\n", "utf8");
  w("value-ledger.json", built.ledger);
  w("quarantine-candidates.json", { schema: "loc-delivery-quarantine-candidates.v1", candidates: built.quarantine });
  w("demotion-candidates.json", { schema: "loc-delivery-demotion-candidates.v1", candidates: built.demotion });
  w("retirement-evidence.json", built.retirementEvidence);
  w("lean-delta.json", built.leanDelta);
  fs.writeFileSync(path.join(reportsDir, "LOC-DELIVERY-LEAN-VALUE.md"), buildLeanMarkdown(built), "utf8");
}

module.exports = { listSourceFiles, scanUsage, scoreBoundary, buildLeanValue, buildLeanMarkdown, writeLeanValue };
