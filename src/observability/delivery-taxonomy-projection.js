// warehouse:file
// responsibility: Build deterministic read-only projections (taxonomy, agent packet, markdown) from the canonical loc-delivery-chain dataset
// actor: delivery_report_renderer
// role: renderer
// source_truth: taxonomy/loc-delivery-chain.json

const fs = require("fs");
const path = require("path");

const CHAIN_PATH = "taxonomy/loc-delivery-chain.json";

// warehouse:method
// responsibility: Read and parse the canonical delivery chain dataset from the repo root
// actor: method_implementation
// role: implementation
// source_truth: taxonomy/loc-delivery-chain.json
function loadChain(repoRoot) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, CHAIN_PATH), "utf8"));
}

// warehouse:method
// responsibility: Enumerate the delivery source files that actually exist in the repo for coverage comparison
// actor: method_implementation
// role: implementation
// source_truth: taxonomy/loc-delivery-chain.json
function discoverDeliveryFiles(repoRoot) {
  const found = [];
  const addIf = (rel) => {
    if (fs.existsSync(path.join(repoRoot, rel)) && fs.statSync(path.join(repoRoot, rel)).isFile()) found.push(rel);
  };
  addIf("taxonomy/loc-delivery-chain.json");
  addIf("contracts/loc-delivery-manifest.schema.json");
  addIf("cli/loc-delivery.js");
  addIf("src/observability/delivery-readiness-report.js");

  const listDir = (rel, filter) => {
    const abs = path.join(repoRoot, rel);
    if (!fs.existsSync(abs)) return;
    for (const name of fs.readdirSync(abs)) {
      const childRel = `${rel}/${name}`;
      if (fs.statSync(path.join(repoRoot, childRel)).isFile() && (!filter || filter(name))) found.push(childRel);
    }
  };
  listDir("src/delivery");
  listDir("src/observability", (name) => /delivery/i.test(name) && name.endsWith(".js"));
  listDir("cli", (name) => /delivery/i.test(name) && name.endsWith(".js"));
  listDir("tests/fixtures/delivery");
  listDir("tests", (name) => /delivery/i.test(name) && name.endsWith(".js"));

  return [...new Set(found)].sort();
}

// warehouse:method
// responsibility: Compute whether the taxonomy explains every real delivery file and whether every source boundary exists on disk
// actor: method_implementation
// role: implementation
// source_truth: taxonomy/loc-delivery-chain.json
function computeCoverage(chain, repoRoot) {
  const boundaries = chain.delivery_boundaries || [];
  const boundaryPaths = new Set(boundaries.map((b) => b.canonical_path));

  const sourceBoundaries = boundaries.filter((b) => !b.canonical_path.startsWith("reports/") && !b.canonical_path.endsWith("/"));
  const missingFiles = sourceBoundaries
    .filter((b) => !fs.existsSync(path.join(repoRoot, b.canonical_path)))
    .map((b) => b.canonical_path)
    .sort();

  const discovered = discoverDeliveryFiles(repoRoot);
  const explainedFiles = discovered.filter((f) => boundaryPaths.has(f)).sort();
  const orphanFiles = discovered.filter((f) => !boundaryPaths.has(f)).sort();

  return {
    source_boundary_count: sourceBoundaries.length,
    report_boundary_count: boundaries.length - sourceBoundaries.length,
    discovered_delivery_file_count: discovered.length,
    explained_files: explainedFiles,
    missing_files: missingFiles,
    orphan_files: orphanFiles,
    explains_every_file: missingFiles.length === 0 && orphanFiles.length === 0,
  };
}

// warehouse:method
// responsibility: Assemble the normalized read-only taxonomy projection object from the chain and computed coverage
// actor: method_implementation
// role: implementation
// source_truth: taxonomy/loc-delivery-chain.json
function buildProjection(chain, coverage) {
  return {
    schema: "loc-delivery-taxonomy-projection.v1",
    source_truth: CHAIN_PATH,
    taxonomy_id: chain.taxonomy_id,
    status: chain.status,
    source_generated_at: chain.generated_at,
    summary: {
      stories: (chain.stories || []).length,
      actors: (chain.actors || []).length,
      acceptance_scenarios: (chain.acceptance_scenarios || []).length,
      evidence_artifact_types: (chain.evidence_artifact_types || []).length,
      delivery_boundaries: (chain.delivery_boundaries || []).length,
      gates: ((chain.gate_semantics || {}).per_gate_policy || []).length,
    },
    value_chain: chain.value_chain,
    stories: chain.stories,
    actors: chain.actors,
    acceptance_scenarios: chain.acceptance_scenarios,
    evidence_artifact_types: chain.evidence_artifact_types,
    gate_semantics: chain.gate_semantics,
    waiver_semantics: chain.waiver_semantics,
    learning_record_semantics: chain.learning_record_semantics,
    delivery_boundaries: chain.delivery_boundaries,
    lean_value_governance: chain.lean_value_governance,
    coverage,
  };
}

// warehouse:method
// responsibility: Assemble a chat-free agent work packet that lets a downstream agent act from data alone
// actor: method_implementation
// role: implementation
// source_truth: taxonomy/loc-delivery-chain.json
function buildAgentPacket(chain, coverage) {
  const nextActions = [];
  if (coverage.missing_files.length) nextActions.push(`Restore or remove ${coverage.missing_files.length} boundary file(s) with no source on disk.`);
  if (coverage.orphan_files.length) nextActions.push(`Add a boundary for ${coverage.orphan_files.length} delivery file(s) not yet explained by the taxonomy.`);
  if (coverage.explains_every_file) nextActions.push("Taxonomy explains every delivery file; safe to proceed to anchored implementation per Phase 3.");

  return {
    schema: "loc-delivery-taxonomy-agent-packet.v1",
    source_truth: CHAIN_PATH,
    source_generated_at: chain.generated_at,
    instruction: "Consume this packet, not chat context. The canonical taxonomy is source of truth. Do not invent boundaries, gate semantics, or waivers.",
    value_chain: chain.value_chain,
    stories: chain.stories,
    boundaries: (chain.delivery_boundaries || []).map((b) => ({
      boundary_id: b.boundary_id,
      canonical_path: b.canonical_path,
      actor: b.actor,
      role: b.role,
      responsibility: b.responsibility,
      story_links: b.story_links,
      acceptance_links: b.acceptance_links,
    })),
    gate_states: (chain.gate_semantics || {}).decision_states,
    lean_value_governance: chain.lean_value_governance,
    coverage,
    next_actions: nextActions,
  };
}

// warehouse:method
// responsibility: Render the human-readable markdown summary of the delivery taxonomy and its coverage
// actor: method_implementation
// role: implementation
// source_truth: taxonomy/loc-delivery-chain.json
function buildMarkdown(chain, coverage) {
  const lines = [];
  lines.push("# LOC Delivery Taxonomy", "");
  lines.push(`Source: \`${CHAIN_PATH}\`  ·  Status: \`${chain.status}\`  ·  Generated from dataset \`${chain.generated_at}\``, "");
  lines.push("> Read-only projection. The dataset is the source of truth; this file is generated.", "");
  lines.push("## Coverage", "");
  lines.push(`- Explains every delivery file: **${coverage.explains_every_file ? "yes" : "no"}**`);
  lines.push(`- Delivery files discovered: ${coverage.discovered_delivery_file_count}, explained: ${coverage.explained_files.length}`);
  lines.push(`- Missing boundary files: ${coverage.missing_files.length}${coverage.missing_files.length ? " (" + coverage.missing_files.join(", ") + ")" : ""}`);
  lines.push(`- Orphan delivery files (no boundary): ${coverage.orphan_files.length}${coverage.orphan_files.length ? " (" + coverage.orphan_files.join(", ") + ")" : ""}`, "");
  lines.push("## Value Chain", "", "`" + (chain.value_chain || []).join(" -> ") + "`", "");
  lines.push("## Boundaries", "", "| Boundary | Path | Actor | Role | Responsibility |", "| --- | --- | --- | --- | --- |");
  for (const b of chain.delivery_boundaries || []) {
    lines.push(`| ${b.boundary_id} | \`${b.canonical_path}\` | ${b.actor} | ${b.role} | ${b.responsibility} |`);
  }
  lines.push("", "## Gate Decision States", "");
  for (const [state, meaning] of Object.entries((chain.gate_semantics || {}).decision_states || {})) {
    lines.push(`- **${state}**: ${meaning}`);
  }
  lines.push("");
  return lines.join("\n");
}

// warehouse:method
// responsibility: Build all three projection artifacts deterministically from the chain (no wall-clock input)
// actor: method_implementation
// role: implementation
// source_truth: taxonomy/loc-delivery-chain.json
function buildAll(chain, repoRoot) {
  const coverage = computeCoverage(chain, repoRoot);
  return {
    coverage,
    projection: buildProjection(chain, coverage),
    agentPacket: buildAgentPacket(chain, coverage),
    markdown: buildMarkdown(chain, coverage),
  };
}

// warehouse:method
// responsibility: Write the projection artifacts into the reports directory and return their paths
// actor: method_implementation
// role: implementation
// source_truth: taxonomy/loc-delivery-chain.json
function writeProjection(reportsDir, built) {
  const latestDir = path.join(reportsDir, "loc-delivery-taxonomy", "latest");
  fs.mkdirSync(latestDir, { recursive: true });
  const paths = {
    taxonomy: path.join(latestDir, "taxonomy.json"),
    agentPacket: path.join(latestDir, "agent-packet.json"),
    markdown: path.join(reportsDir, "LOC-DELIVERY-TAXONOMY.md"),
  };
  fs.writeFileSync(paths.taxonomy, JSON.stringify(built.projection, null, 2) + "\n", "utf8");
  fs.writeFileSync(paths.agentPacket, JSON.stringify(built.agentPacket, null, 2) + "\n", "utf8");
  fs.writeFileSync(paths.markdown, built.markdown, "utf8");
  return paths;
}

module.exports = { loadChain, discoverDeliveryFiles, computeCoverage, buildProjection, buildAgentPacket, buildMarkdown, buildAll, writeProjection };
