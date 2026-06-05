// warehouse:file
// responsibility: Extract deterministic package taxonomy, Python anchor, and worker-input census reports from the neighboring ai-engine packages
// actor: delivery_report_renderer
// role: renderer
// source_truth: taxonomy/loc-delivery-chain.json

const fs = require("fs");
const path = require("path");

const PY_FILE_ANCHOR_FIELDS = ["warehouse:file", "actor", "role", "responsibility", "source_truth"];
const DEFAULT_WORKER_BATCH_SIZE = 20;

// warehouse:method
// responsibility: Normalize paths to deterministic slash-separated form for report artifacts
function normalizePath(value) {
  return value.replace(/\\/g, "/");
}

// warehouse:method
// responsibility: Read a text file safely and return an empty string when the optional file is absent
function readTextSafe(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (_error) {
    return "";
  }
}

// warehouse:method
// responsibility: Parse JSON files after removing a UTF-8 byte order mark so package metadata is BOM-safe
function parseJsonBomSafe(text, label = "json") {
  try {
    return { value: JSON.parse(text.replace(/^\uFEFF/, "")), error: null };
  } catch (error) {
    return { value: null, error: `${label}: ${error.message}` };
  }
}

// warehouse:method
// responsibility: Return sorted directory names for package roots without mutating the source repository
function listPackageDirectories(packagesRoot) {
  if (!fs.existsSync(packagesRoot)) return [];
  return fs.readdirSync(packagesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

// warehouse:method
// responsibility: Recursively list files under a package with deterministic ordering and optional extension filtering
function listFiles(root, options = {}) {
  const files = [];
  const extensions = options.extensions ? new Set(options.extensions) : null;
  function walk(relDir) {
    const absDir = path.join(root, relDir);
    if (!fs.existsSync(absDir)) return;
    for (const name of fs.readdirSync(absDir).sort((a, b) => a.localeCompare(b))) {
      const rel = relDir ? `${relDir}/${name}` : name;
      const abs = path.join(root, rel);
      const stat = fs.statSync(abs);
      if (stat.isDirectory()) walk(rel);
      else if (!extensions || extensions.has(path.extname(name).toLowerCase())) files.push(normalizePath(rel));
    }
  }
  walk("");
  return files;
}

// warehouse:method
// responsibility: Extract leading warehouse file anchors from a Python file header
function parsePythonFileAnchor(text) {
  const lines = text.split(/\r?\n/).slice(0, 30);
  const anchor = {};
  for (const raw of lines) {
    const fileMatch = raw.match(/^\s*#\s*warehouse:file\s*$/);
    if (fileMatch) {
      anchor["warehouse:file"] = "";
      continue;
    }
    const match = raw.match(/^\s*#\s*(actor|role|responsibility|source_truth):\s*(.*)\s*$/);
    if (!match) continue;
    anchor[match[1]] = match[2].trim();
  }
  const missing = PY_FILE_ANCHOR_FIELDS.filter((field) => (
    field === "warehouse:file" ? !Object.prototype.hasOwnProperty.call(anchor, field) : !anchor[field]
  ));
  return {
    present: anchor["warehouse:file"] === "",
    full: missing.length === 0,
    missing,
    actor: anchor.actor || "",
    role: anchor.role || "",
    responsibility: anchor.responsibility || "",
    source_truth: anchor.source_truth || "",
  };
}

// warehouse:method
// responsibility: Extract method anchors and nearby method names from Python source for responsibility census rows
function parsePythonMethodAnchors(text) {
  const lines = text.split(/\r?\n/);
  const anchors = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (!/^\s*#\s*warehouse:method\s*$/.test(lines[i])) continue;
    let responsibility = "";
    let methodName = "";
    for (let j = i + 1; j < Math.min(lines.length, i + 8); j += 1) {
      const resp = lines[j].match(/^\s*#\s*responsibility:\s*(.*)\s*$/);
      if (resp) responsibility = resp[1].trim();
      const method = lines[j].match(/^\s*(?:async\s+)?def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/);
      const klass = lines[j].match(/^\s*class\s+([A-Za-z_][A-Za-z0-9_]*)\s*[\(:]/);
      if (method) { methodName = method[1]; break; }
      if (klass) { methodName = klass[1]; break; }
    }
    anchors.push({ line: i + 1, method_name: methodName, responsibility });
  }
  return anchors;
}

// warehouse:method
// responsibility: Build Python anchor statistics for one package without sending source bodies to worker packets
function buildPythonAnchorSummary(packageRoot) {
  const files = listFiles(packageRoot, { extensions: [".py"] });
  const actors = new Map();
  const roles = new Map();
  const sourceTruths = new Map();
  const responsibilityCounts = new Map();
  const missingFileAnchors = [];
  const methodAnchorSamples = [];
  let fileAnchorCount = 0;
  let fullFileAnchorCount = 0;
  let methodAnchorCount = 0;

  for (const rel of files) {
    const text = readTextSafe(path.join(packageRoot, rel));
    const fileAnchor = parsePythonFileAnchor(text);
    if (fileAnchor.present) fileAnchorCount += 1;
    if (fileAnchor.full) fullFileAnchorCount += 1;
    else missingFileAnchors.push({ path: rel, missing: fileAnchor.missing });
    if (fileAnchor.actor) actors.set(fileAnchor.actor, (actors.get(fileAnchor.actor) || 0) + 1);
    if (fileAnchor.role) roles.set(fileAnchor.role, (roles.get(fileAnchor.role) || 0) + 1);
    if (fileAnchor.source_truth) sourceTruths.set(fileAnchor.source_truth, (sourceTruths.get(fileAnchor.source_truth) || 0) + 1);
    if (fileAnchor.responsibility) {
      responsibilityCounts.set(fileAnchor.responsibility, (responsibilityCounts.get(fileAnchor.responsibility) || 0) + 1);
    }

    const methodAnchors = parsePythonMethodAnchors(text);
    methodAnchorCount += methodAnchors.length;
    for (const methodAnchor of methodAnchors) {
      if (methodAnchorSamples.length >= 8) break;
      methodAnchorSamples.push({ path: rel, ...methodAnchor });
    }
  }

  return {
    python_file_count: files.length,
    file_anchor_count: fileAnchorCount,
    full_file_anchor_count: fullFileAnchorCount,
    missing_file_anchors: missingFileAnchors,
    method_anchor_count: methodAnchorCount,
    actors: Object.fromEntries([...actors.entries()].sort()),
    roles: Object.fromEntries([...roles.entries()].sort()),
    source_truths: Object.fromEntries([...sourceTruths.entries()].sort()),
    responsibility_samples: [...responsibilityCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 8)
      .map(([responsibility, count]) => ({ responsibility, count })),
    method_anchor_samples: methodAnchorSamples,
  };
}

// warehouse:method
// responsibility: Extract package metadata and WPI tags from package.json with BOM-safe parsing
function readPackageJson(packageRoot) {
  const filePath = path.join(packageRoot, "package.json");
  if (!fs.existsSync(filePath)) {
    return { exists: false, parse_error: null, data: null };
  }
  const parsed = parseJsonBomSafe(readTextSafe(filePath), filePath);
  if (parsed.error) {
    return { exists: true, parse_error: parsed.error, data: null };
  }
  const pkg = parsed.value || {};
  return {
    exists: true,
    parse_error: null,
    data: {
      name: pkg.name || "",
      version: pkg.version || "",
      description: pkg.description || "",
      private: pkg.private === true,
      type: pkg.type || "",
      main: pkg.main || "",
      keywords: Array.isArray(pkg.keywords) ? [...pkg.keywords].sort() : [],
      scripts: Object.keys(pkg.scripts || {}).sort(),
      exports: pkg.exports ? Object.keys(pkg.exports).sort() : [],
      bin: pkg.bin ? Object.keys(pkg.bin).sort() : [],
      repository_directory: pkg.repository && pkg.repository.directory ? pkg.repository.directory : "",
      wpi: pkg.wpi || null,
    },
  };
}

// warehouse:method
// responsibility: Extract bounded evidence and projection references from generated package docs
function extractEvidenceRefs(text) {
  const refs = new Set();
  const patterns = [
    /(?:docs|generated|reports|taxonomy|contracts)\/[A-Za-z0-9_./() &-]+\.(?:md|json|yaml|yml|py|js)/g,
    /C:\\source\\repos\\bpm\\internal\\ai-engine\\[A-Za-z0-9_./\\() &-]+\.(?:md|json|yaml|yml|py|js)/g,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      refs.add(normalizePath(match[0]).trim());
    }
  }
  return [...refs].sort((a, b) => a.localeCompare(b));
}

// warehouse:method
// responsibility: Infer the package discovery lane from names, WPI family, keywords, roles, and responsibilities
function inferDiscoveryLane(packageName, packageJson, anchors) {
  const wpi = packageJson.data && packageJson.data.wpi ? packageJson.data.wpi : {};
  const haystack = [
    packageName,
    packageJson.data ? packageJson.data.name : "",
    packageJson.data ? packageJson.data.description : "",
    ...(packageJson.data ? packageJson.data.keywords : []),
    wpi.package_family || "",
    ...Object.keys(anchors.roles || {}),
    ...anchors.responsibility_samples.map((entry) => entry.responsibility),
  ].join(" ").toLowerCase();

  if (/sdk|client|wrapper/.test(haystack)) return "sdk_client";
  if (/projection|workspace|trust|control plane/.test(haystack)) return "projection_trust";
  if (/inventory|repo|architecture integrity|code intelligence|wirp/.test(haystack)) return "inventory_wirp";
  if (/documentation|markdown|ovp|operational value proof|reporting|artifact/.test(haystack)) return "evidence_docs";
  if (/worker|learning loop|trust elevation|execution telemetry|agent/.test(haystack)) return "worker_learning";
  if (/capability|governance|authority|authorization|contract|policy|security/.test(haystack)) return "governance_auth";
  if (/persistence|store|data access|sql/.test(haystack)) return "persistence";
  if (/\bui\b|console|vscode|web|demo|design/.test(haystack)) return "ui_demo";
  return "unknown";
}

// warehouse:method
// responsibility: Determine worker-review need from deterministic census gaps, external value signals, and taxonomy confidence
function buildTriage(packageName, packageJson, anchors, supportingSurfaces, lane) {
  const reasons = [];
  if (!packageJson.exists) reasons.push("missing package.json");
  if (packageJson.parse_error) reasons.push("package.json parse error");
  if (anchors.python_file_count > 0 && anchors.full_file_anchor_count !== anchors.python_file_count) {
    reasons.push("missing Python file anchors");
  }
  if (!packageJson.data || !packageJson.data.wpi) reasons.push("missing WPI metadata");
  if (lane === "sdk_client" || lane === "projection_trust" || lane === "governance_auth") {
    reasons.push(`${lane} lane requires value and public/private boundary review`);
  }
  if (Object.keys(anchors.source_truths || {}).includes("code_only")) {
    reasons.push("code_only source truth requires taxonomy alignment review");
  }
  if (!supportingSurfaces.has_readme && !supportingSurfaces.has_manifest) {
    reasons.push("missing generated README/MANIFEST projection");
  }
  const confidence = reasons.length === 0 ? "high" : reasons.length <= 2 ? "medium" : "low";
  return {
    needs_worker_review: reasons.length > 0,
    worker_reason: reasons.join("; "),
    confidence,
  };
}

// warehouse:method
// responsibility: Build one normalized package census row from metadata, anchors, docs, contracts, and triage signals
function buildPackageRow(packagesRoot, packageName) {
  const packageRoot = path.join(packagesRoot, packageName);
  const packageJson = readPackageJson(packageRoot);
  const anchors = buildPythonAnchorSummary(packageRoot);
  const readmeText = readTextSafe(path.join(packageRoot, "README.md"));
  const manifestText = readTextSafe(path.join(packageRoot, "MANIFEST.md"));
  const scaffold = fs.existsSync(path.join(packageRoot, "scaffold.json"))
    ? parseJsonBomSafe(readTextSafe(path.join(packageRoot, "scaffold.json")), `${packageName}/scaffold.json`)
    : { value: null, error: null };
  const contractFiles = fs.existsSync(path.join(packageRoot, "contracts"))
    ? listFiles(path.join(packageRoot, "contracts")).slice(0, 50)
    : [];
  const supportingSurfaces = {
    has_readme: Boolean(readmeText),
    has_manifest: Boolean(manifestText),
    has_contracts: contractFiles.length > 0,
    has_scaffold: Boolean(scaffold.value),
    scaffold_responsibility_domain: scaffold.value && scaffold.value.responsibility_domain ? scaffold.value.responsibility_domain : "",
    scaffold_parse_error: scaffold.error,
    contract_file_count: contractFiles.length,
    contract_samples: contractFiles.slice(0, 8),
    evidence_refs: [...new Set([
      ...extractEvidenceRefs(readmeText),
      ...extractEvidenceRefs(manifestText),
      ...((packageJson.data && packageJson.data.wpi && Array.isArray(packageJson.data.wpi.evidence)) ? packageJson.data.wpi.evidence : []),
    ])].sort((a, b) => a.localeCompare(b)),
  };
  const lane = inferDiscoveryLane(packageName, packageJson, anchors);
  const triage = buildTriage(packageName, packageJson, anchors, supportingSurfaces, lane);
  const packageId = packageJson.data && packageJson.data.name ? packageJson.data.name : packageName;

  return {
    package_id: packageId,
    folder_name: packageName,
    package_path: normalizePath(packageRoot),
    package_json: packageJson,
    wpi: packageJson.data ? packageJson.data.wpi : null,
    anchors,
    supporting_surfaces: supportingSurfaces,
    normalized: {
      discovery_lane: lane,
      candidate_domain: lane === "unknown" ? "" : lane,
      authority_posture: Object.keys(anchors.source_truths).includes("sql_backed") ? "sql_backed" : "review_required",
      initial_promotion_posture: lane === "sdk_client" ? "sdk_candidate_watchlist" : "internal_capability",
      confidence: triage.confidence,
    },
    triage,
  };
}

// warehouse:method
// responsibility: Roll up deterministic counts across package rows for operator visibility
function summarizeRows(rows) {
  const rollup = {
    package_count: rows.length,
    package_json_count: rows.filter((row) => row.package_json.exists).length,
    package_json_parse_error_count: rows.filter((row) => row.package_json.parse_error).length,
    wpi_count: rows.filter((row) => row.wpi).length,
    readme_count: rows.filter((row) => row.supporting_surfaces.has_readme).length,
    manifest_count: rows.filter((row) => row.supporting_surfaces.has_manifest).length,
    contracts_count: rows.filter((row) => row.supporting_surfaces.has_contracts).length,
    scaffold_count: rows.filter((row) => row.supporting_surfaces.has_scaffold).length,
    python_file_count: rows.reduce((total, row) => total + row.anchors.python_file_count, 0),
    python_file_anchor_count: rows.reduce((total, row) => total + row.anchors.file_anchor_count, 0),
    python_full_file_anchor_count: rows.reduce((total, row) => total + row.anchors.full_file_anchor_count, 0),
    python_method_anchor_count: rows.reduce((total, row) => total + row.anchors.method_anchor_count, 0),
    worker_review_count: rows.filter((row) => row.triage.needs_worker_review).length,
    by_lane: {},
    by_wpi_posture: {},
    by_wpi_promotion_readiness: {},
    by_source_truth: {},
    by_actor: {},
    by_role: {},
  };

  function add(map, key, count = 1) {
    if (!key) return;
    map[key] = (map[key] || 0) + count;
  }

  for (const row of rows) {
    add(rollup.by_lane, row.normalized.discovery_lane);
    if (row.wpi) {
      add(rollup.by_wpi_posture, row.wpi.posture);
      add(rollup.by_wpi_promotion_readiness, row.wpi.promotion_readiness);
    }
    for (const [key, count] of Object.entries(row.anchors.source_truths)) add(rollup.by_source_truth, key, count);
    for (const [key, count] of Object.entries(row.anchors.actors)) add(rollup.by_actor, key, count);
    for (const [key, count] of Object.entries(row.anchors.roles)) add(rollup.by_role, key, count);
  }

  for (const key of ["by_lane", "by_wpi_posture", "by_wpi_promotion_readiness", "by_source_truth", "by_actor", "by_role"]) {
    rollup[key] = Object.fromEntries(Object.entries(rollup[key]).sort((a, b) => a[0].localeCompare(b[0])));
  }

  return rollup;
}

// warehouse:method
// responsibility: Build compact worker input batches from census rows without embedding full source content
function buildWorkerInput(census, options = {}) {
  const batchSize = options.batchSize || DEFAULT_WORKER_BATCH_SIZE;
  const candidates = census.packages
    .filter((row) => row.triage.needs_worker_review)
    .map((row) => ({
      package_id: row.package_id,
      folder_name: row.folder_name,
      package_path: row.package_path,
      discovery_lane: row.normalized.discovery_lane,
      initial_promotion_posture: row.normalized.initial_promotion_posture,
      wpi: row.wpi ? {
        candidate_key: row.wpi.candidate_key || "",
        package_family: row.wpi.package_family || "",
        posture: row.wpi.posture || "",
        promotion_readiness: row.wpi.promotion_readiness || "",
        integrity_score: row.wpi.integrity_score || null,
      } : null,
      anchors: {
        python_file_count: row.anchors.python_file_count,
        full_file_anchor_count: row.anchors.full_file_anchor_count,
        method_anchor_count: row.anchors.method_anchor_count,
        actors: Object.keys(row.anchors.actors),
        roles: Object.keys(row.anchors.roles),
        source_truths: Object.keys(row.anchors.source_truths),
        responsibility_samples: row.anchors.responsibility_samples.slice(0, 4),
      },
      evidence_refs: row.supporting_surfaces.evidence_refs.slice(0, 8),
      worker_reason: row.triage.worker_reason,
      confidence: row.triage.confidence,
    }));

  const batches = [];
  for (let i = 0; i < candidates.length; i += batchSize) {
    batches.push({
      packet_id: `PKG-TAX-${String(batches.length + 1).padStart(3, "0")}`,
      mode: "read_only",
      tier: "low",
      objective: "Review package taxonomy census rows for value-led package ledger classification.",
      candidates: candidates.slice(i, i + batchSize),
      forbidden: [
        "move packages",
        "delete files",
        "change source code",
        "rewrite package metadata",
        "invent market claims",
        "claim SDK readiness without evidence",
      ],
      required_output: [
        "package_findings",
        "promotion_posture_recommendations",
        "evidence_gaps",
        "taxonomy_mismatches",
        "counterevidence",
        "next_gate",
      ],
    });
  }

  return {
    schema: "package-taxonomy-worker-input.v1",
    source_census_schema: census.schema,
    source_packages_root: census.source_packages_root,
    package_count: census.summary.package_count,
    worker_review_count: candidates.length,
    batch_size: batchSize,
    batches,
  };
}

// warehouse:method
// responsibility: Build the full deterministic package taxonomy census from the ai-engine package directory
function buildPackageTaxonomyCensus(packagesRoot) {
  const resolvedRoot = path.resolve(packagesRoot);
  const packageNames = listPackageDirectories(resolvedRoot);
  const rows = packageNames.map((name) => buildPackageRow(resolvedRoot, name));
  const census = {
    schema: "package-taxonomy-census.v1",
    source_truth: "C:/source/repos/bpm/internal/ai-engine/packages",
    source_packages_root: normalizePath(resolvedRoot),
    generated_at: "deterministic",
    summary: summarizeRows(rows),
    packages: rows,
  };
  return census;
}

// warehouse:method
// responsibility: Render human-readable markdown from the package taxonomy census and worker review rollups
function formatPackageTaxonomyCensusMarkdown(census) {
  const s = census.summary;
  const lines = [];
  lines.push("# Package Taxonomy Census", "");
  lines.push("> Read-only deterministic census. This report extracts existing package tags and Python anchors before worker-bee review.", "");
  lines.push("## Summary", "");
  lines.push(`- Package directories: ${s.package_count}`);
  lines.push(`- package.json files: ${s.package_json_count}  parse errors: ${s.package_json_parse_error_count}`);
  lines.push(`- WPI-tagged packages: ${s.wpi_count}`);
  lines.push(`- Python files: ${s.python_file_count}`);
  lines.push(`- Python file anchors: ${s.python_file_anchor_count}`);
  lines.push(`- Full Python file anchor sets: ${s.python_full_file_anchor_count}`);
  lines.push(`- Python method anchors: ${s.python_method_anchor_count}`);
  lines.push(`- Packages needing worker review: ${s.worker_review_count}`);
  lines.push("");
  lines.push("## Discovery Lanes", "");
  lines.push("| Lane | Packages |", "| --- | ---: |");
  for (const [lane, count] of Object.entries(s.by_lane)) lines.push(`| ${lane} | ${count} |`);
  lines.push("");
  lines.push("## WPI Postures", "");
  lines.push("| Posture | Packages |", "| --- | ---: |");
  for (const [posture, count] of Object.entries(s.by_wpi_posture)) lines.push(`| ${posture} | ${count} |`);
  lines.push("");
  lines.push("## Source Truth Rollup", "");
  lines.push("| Source truth | Python files |", "| --- | ---: |");
  for (const [sourceTruth, count] of Object.entries(s.by_source_truth)) lines.push(`| ${sourceTruth} | ${count} |`);
  lines.push("");
  lines.push("## Top Worker Review Packages", "");
  lines.push("| Package | Lane | Confidence | Reason |", "| --- | --- | --- | --- |");
  for (const row of census.packages.filter((entry) => entry.triage.needs_worker_review).slice(0, 30)) {
    lines.push(`| ${row.folder_name} | ${row.normalized.discovery_lane} | ${row.triage.confidence} | ${String(row.triage.worker_reason).replace(/\|/g, "\\|")} |`);
  }
  lines.push("");
  lines.push("## Acceptance Notes", "");
  lines.push("- No package movement or source mutation is performed.");
  lines.push("- Missing optional README, MANIFEST, scaffold, and contracts files are recorded, not treated as fatal.");
  lines.push("- Worker packets should consume `reports/package-taxonomy-census/worker-input.json` instead of scanning all packages with open-ended AI review.");
  lines.push("");
  return lines.join("\n");
}

// warehouse:method
// responsibility: Write census JSON, markdown, and compact worker input reports to the repository reports directory
function writePackageTaxonomyCensusReports(repoRoot, census, options = {}) {
  const reportsDir = options.reportsDir ? path.resolve(repoRoot, options.reportsDir) : path.join(repoRoot, "reports");
  const latestDir = path.join(reportsDir, "package-taxonomy-census");
  fs.mkdirSync(latestDir, { recursive: true });

  const workerInput = buildWorkerInput(census, options);
  const markdown = formatPackageTaxonomyCensusMarkdown(census);
  const artifacts = {
    latestJsonPath: path.join(latestDir, "latest.json"),
    workerInputPath: path.join(latestDir, "worker-input.json"),
    latestMarkdownPath: path.join(reportsDir, "PACKAGE-TAXONOMY-CENSUS-LATEST.md"),
  };
  fs.writeFileSync(artifacts.latestJsonPath, `${JSON.stringify(census, null, 2)}\n`, "utf8");
  fs.writeFileSync(artifacts.workerInputPath, `${JSON.stringify(workerInput, null, 2)}\n`, "utf8");
  fs.writeFileSync(artifacts.latestMarkdownPath, markdown, "utf8");
  return artifacts;
}

// warehouse:method
// responsibility: Compare expected report contents to current files so check mode detects stale generated reports
function checkPackageTaxonomyCensusReports(repoRoot, census, options = {}) {
  const reportsDir = options.reportsDir ? path.resolve(repoRoot, options.reportsDir) : path.join(repoRoot, "reports");
  const latestDir = path.join(reportsDir, "package-taxonomy-census");
  const expected = {
    [path.join(latestDir, "latest.json")]: `${JSON.stringify(census, null, 2)}\n`,
    [path.join(latestDir, "worker-input.json")]: `${JSON.stringify(buildWorkerInput(census, options), null, 2)}\n`,
    [path.join(reportsDir, "PACKAGE-TAXONOMY-CENSUS-LATEST.md")]: formatPackageTaxonomyCensusMarkdown(census),
  };
  const drift = [];
  for (const [filePath, content] of Object.entries(expected)) {
    if (!fs.existsSync(filePath)) {
      drift.push({ path: normalizePath(filePath), reason: "missing" });
      continue;
    }
    const actual = fs.readFileSync(filePath, "utf8");
    if (actual !== content) drift.push({ path: normalizePath(filePath), reason: "drift" });
  }
  return { ok: drift.length === 0, drift };
}

module.exports = {
  parseJsonBomSafe,
  parsePythonFileAnchor,
  parsePythonMethodAnchors,
  buildPackageTaxonomyCensus,
  buildWorkerInput,
  formatPackageTaxonomyCensusMarkdown,
  writePackageTaxonomyCensusReports,
  checkPackageTaxonomyCensusReports,
};
