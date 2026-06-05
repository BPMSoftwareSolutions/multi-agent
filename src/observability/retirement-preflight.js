// warehouse:file
// responsibility: Validate retirement candidates against active references and retirement evidence before any move or delete
// actor: delivery_orchestrator
// role: retirement_guard
// source_truth: taxonomy/loc-delivery-chain.json

const fs = require("fs");
const path = require("path");

const DEFAULT_SKIP_DIRS = new Set([".git", "node_modules", ".studio", "retired", "test-results"]);
const SOURCE_EXTENSIONS = new Set([".js", ".json", ".md", ".txt"]);

// warehouse:method
// responsibility: Normalize a repository-relative path to deterministic slash-separated form
function normalizePath(candidate) {
  return candidate.replace(/\\/g, "/").replace(/^\.\/+/, "");
}

// warehouse:method
// responsibility: Determine whether a file extension should be scanned for retirement references
function isScannableFile(filePath) {
  return SOURCE_EXTENSIONS.has(path.extname(filePath).toLowerCase()) || path.basename(filePath) === "package.json";
}

// warehouse:method
// responsibility: List active repository files that can carry references to retirement candidates
function listActiveFiles(repoRoot, options = {}) {
  const skipDirs = options.skipDirs || DEFAULT_SKIP_DIRS;
  const files = [];

  function walk(relDir) {
    const absDir = path.join(repoRoot, relDir);
    if (!fs.existsSync(absDir)) return;
    for (const name of fs.readdirSync(absDir).sort()) {
      if (skipDirs.has(name)) continue;
      const rel = relDir ? `${relDir}/${name}` : name;
      const abs = path.join(repoRoot, rel);
      const stat = fs.statSync(abs);
      if (stat.isDirectory()) walk(rel);
      else if (stat.isFile() && isScannableFile(rel)) files.push(normalizePath(rel));
    }
  }

  walk("");
  return files.sort();
}

// warehouse:method
// responsibility: Read a text file safely and return an empty string when it cannot be read
function readText(repoRoot, relPath) {
  try {
    return fs.readFileSync(path.join(repoRoot, relPath), "utf8");
  } catch (_error) {
    return "";
  }
}

// warehouse:method
// responsibility: Resolve require and import specifiers to repository-relative candidate paths
function resolveModuleReference(repoRoot, fromFile, specifier) {
  if (!specifier.startsWith(".")) return null;
  const fromDir = path.dirname(path.join(repoRoot, fromFile));
  const base = path.resolve(fromDir, specifier);
  const candidates = [base, `${base}.js`, `${base}.json`, path.join(base, "index.js")];
  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;
    const rel = normalizePath(path.relative(repoRoot, candidate));
    if (!rel.startsWith("../")) return rel;
  }
  return null;
}

// warehouse:method
// responsibility: Find active require and import references that resolve to the retirement candidate
function findCallerReferences(repoRoot, candidate, activeFiles) {
  const refs = [];
  const patterns = [
    /require\(\s*["']([^"']+)["']\s*\)/g,
    /import\(\s*["']([^"']+)["']\s*\)/g,
    /from\s+["']([^"']+)["']/g,
  ];

  for (const file of activeFiles.filter((f) => f.endsWith(".js"))) {
    if (file === candidate) continue;
    const text = readText(repoRoot, file);
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (resolveModuleReference(repoRoot, file, match[1]) === candidate) {
          refs.push({ file, reference: match[1] });
        }
      }
    }
  }

  return refs.sort((a, b) => `${a.file}:${a.reference}`.localeCompare(`${b.file}:${b.reference}`));
}

// warehouse:method
// responsibility: Find package scripts, bin entries, and dependency surfaces that name the candidate
function findPackageReferences(repoRoot, candidate) {
  const pkgPath = path.join(repoRoot, "package.json");
  if (!fs.existsSync(pkgPath)) return [];
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const refs = [];

  for (const [name, command] of Object.entries(pkg.scripts || {})) {
    if (String(command).includes(candidate) || String(command).includes(path.basename(candidate))) {
      refs.push({ surface: "script", name, reference: command });
    }
  }

  for (const [name, target] of Object.entries(pkg.bin || {})) {
    if (String(target) === candidate) refs.push({ surface: "bin", name, reference: target });
  }

  return refs.sort((a, b) => `${a.surface}:${a.name}`.localeCompare(`${b.surface}:${b.name}`));
}

// warehouse:method
// responsibility: Find string references to the candidate in selected active files
function findTextReferences(repoRoot, candidate, activeFiles, predicate) {
  const refs = [];
  for (const file of activeFiles.filter(predicate)) {
    if (file === candidate) continue;
    const text = readText(repoRoot, file);
    if (text.includes(candidate)) refs.push({ file, reference: candidate });
  }
  return refs.sort((a, b) => a.file.localeCompare(b.file));
}

// warehouse:method
// responsibility: Load retirement evidence for a candidate from the generated retirement evidence artifact
function loadRetirementEvidence(repoRoot, candidate) {
  const evidencePath = path.join(repoRoot, "reports", "loc-delivery-taxonomy", "latest", "retirement-evidence.json");
  if (!fs.existsSync(evidencePath)) {
    return null;
  }
  const evidence = JSON.parse(fs.readFileSync(evidencePath, "utf8"));
  return (evidence.candidates || []).find((entry) => normalizePath(entry.path) === candidate) || null;
}

// warehouse:method
// responsibility: Convert references into a deterministic pass or blocked scan result
function referenceScan(name, references) {
  return {
    name,
    status: references.length ? "blocked" : "pass",
    references,
  };
}

// warehouse:method
// responsibility: Build the retirement evidence scan result from required evidence fields
function evidenceScan(candidateEvidence) {
  if (!candidateEvidence) {
    return {
      name: "retirement_evidence_scan",
      status: "blocked",
      references: [],
      reason: "candidate is missing from retirement-evidence.json",
      safe_to_remove: false,
    };
  }

  const required = [
    "caller_scan",
    "export_scan",
    "script_reference_scan",
    "test_reference_scan",
    "doc_reference_scan",
    "runtime_use_scan",
    "generated_projection_scan",
  ];
  const pending = required.filter((field) => candidateEvidence[field] !== "pass");
  const safe = candidateEvidence.safe_to_remove === true && pending.length === 0;
  return {
    name: "retirement_evidence_scan",
    status: safe ? "pass" : "blocked",
    references: [],
    pending,
    safe_to_remove: safe,
  };
}

// warehouse:method
// responsibility: Evaluate one retirement candidate without mutating the repository
function evaluateCandidate(repoRoot, rawCandidate, activeFiles) {
  const candidate = normalizePath(rawCandidate);
  const exists = fs.existsSync(path.join(repoRoot, candidate));
  const packageRefs = findPackageReferences(repoRoot, candidate);
  const callerRefs = findCallerReferences(repoRoot, candidate, activeFiles);
  const testRefs = findTextReferences(repoRoot, candidate, activeFiles, (f) => f.startsWith("tests/"));
  const docRefs = findTextReferences(repoRoot, candidate, activeFiles, (f) => f.startsWith("docs/") || f === "README.md");
  const projectionRefs = findTextReferences(
    repoRoot,
    candidate,
    activeFiles,
    (f) => f.startsWith("reports/") && !f.endsWith("retirement-evidence.json")
  );
  const evidence = evidenceScan(loadRetirementEvidence(repoRoot, candidate));

  const scans = {
    candidate_exists: {
      name: "candidate_exists",
      status: exists ? "pass" : "blocked",
      references: [],
      reason: exists ? "" : "candidate file does not exist at active path",
    },
    caller_scan: referenceScan("caller_scan", callerRefs),
    export_scan: referenceScan("export_scan", packageRefs.filter((ref) => ref.surface === "bin")),
    script_reference_scan: referenceScan("script_reference_scan", packageRefs.filter((ref) => ref.surface === "script")),
    test_reference_scan: referenceScan("test_reference_scan", testRefs),
    doc_reference_scan: referenceScan("doc_reference_scan", docRefs),
    runtime_use_scan: referenceScan("runtime_use_scan", callerRefs.concat(packageRefs)),
    generated_projection_scan: referenceScan("generated_projection_scan", projectionRefs),
    retirement_evidence_scan: evidence,
  };

  const blockingReasons = Object.values(scans)
    .filter((scan) => scan.status !== "pass")
    .map((scan) => scan.reason || `${scan.name} has ${scan.references.length} reference(s)`);

  return {
    path: candidate,
    status: blockingReasons.length ? "blocked" : "pass",
    safe_to_remove: blockingReasons.length === 0,
    blocking_reasons: blockingReasons,
    scans,
  };
}

// warehouse:method
// responsibility: Build a deterministic retirement preflight report for candidate paths
function buildRetirementPreflight(repoRoot, candidates, options = {}) {
  const activeFiles = options.activeFiles || listActiveFiles(repoRoot);
  const evaluated = candidates.map((candidate) => evaluateCandidate(repoRoot, candidate, activeFiles));
  const blocked = evaluated.filter((entry) => entry.status !== "pass");
  return {
    schema: "retirement-preflight.v1",
    source_truth: "taxonomy/loc-delivery-chain.json",
    candidates: evaluated,
    summary: {
      candidate_count: evaluated.length,
      pass_count: evaluated.length - blocked.length,
      blocked_count: blocked.length,
      safe_to_remove_count: evaluated.filter((entry) => entry.safe_to_remove).length,
    },
    status: blocked.length ? "blocked" : "pass",
  };
}

module.exports = {
  normalizePath,
  isScannableFile,
  listActiveFiles,
  findCallerReferences,
  findPackageReferences,
  findTextReferences,
  loadRetirementEvidence,
  evaluateCandidate,
  buildRetirementPreflight,
};
