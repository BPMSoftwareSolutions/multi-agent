// Deterministic "reorganize" operation for the worker bee.
//
// A packet declares file moves; the bee performs them AND mechanically rewrites
// every relative require() in the repo so nothing breaks — both the requires
// INSIDE moved files (their directory changed) and requires elsewhere that POINT
// AT moved files. This is pure path math: no AI, idempotent, verifiable.
//
// Packet shape:
//   { "operation": "reorganize", "moves": [ { "from": "bin/x.js", "to": "src/cli/x.js" }, ... ] }

const fs = require("fs");
const path = require("path");

const SKIP_DIRS = new Set([".git", "node_modules", "reports", "test-results", ".studio", "coverage", "dist"]);

function listJsFiles(root) {
  const out = [];
  (function walk(d) {
    let entries;
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch (_e) { return; }
    for (const e of entries) {
      if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(path.join(d, e.name)); }
      else if (e.name.endsWith(".js")) out.push(path.join(d, e.name));
    }
  })(root);
  return out;
}

// Resolve a relative require specifier to the actual file it points at (or null).
function resolveTarget(fromDir, spec) {
  const base = path.resolve(fromDir, spec);
  for (const c of [base, base + ".js", base + ".json", path.join(base, "index.js")]) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

// Build a relative specifier from newFromDir to targetAbs, preserving the original
// extensionless style and posix separators.
function toSpec(newFromDir, targetAbs, originalSpec) {
  let rel = path.relative(newFromDir, targetAbs).split(path.sep).join("/");
  if (!rel.startsWith(".")) rel = "./" + rel;
  const hadExt = /\.(js|json)$/.test(originalSpec);
  if (!hadExt) rel = rel.replace(/\.js$/, "");
  return rel;
}

const REQUIRE_RE = /require\(\s*(["'])(\.[^"']+)\1\s*\)/g;

// Compute the full plan (moves + per-file require rewrites) without touching disk.
function planReorganize(repoRoot, moves) {
  const moveMap = new Map(); // oldAbs -> newAbs
  for (const m of moves) {
    moveMap.set(path.resolve(repoRoot, m.from), path.resolve(repoRoot, m.to));
  }
  const newLocation = (abs) => moveMap.get(abs) || abs;

  const files = listJsFiles(repoRoot);
  const edits = []; // { oldF, newF, moved, text, changes:[{old,new}] }
  let rewriteCount = 0;

  for (const oldF of files) {
    const newF = newLocation(oldF);
    const moved = newF !== oldF;
    const original = fs.readFileSync(oldF, "utf8");
    const changes = [];
    const oldDir = path.dirname(oldF);
    const newDir = path.dirname(newF);

    const text = original.replace(REQUIRE_RE, (full, q, spec) => {
      const targetAbs = resolveTarget(oldDir, spec); // resolved from the OLD location
      if (!targetAbs) return full; // unresolved already — leave as-is
      const newTargetAbs = newLocation(targetAbs);
      if (!moved && newTargetAbs === targetAbs) return full; // nothing relevant moved
      const newSpec = toSpec(newDir, newTargetAbs, spec);
      if (newSpec === spec) return full;
      changes.push({ old: spec, new: newSpec });
      return `require(${q}${newSpec}${q})`;
    });

    if (moved || changes.length) {
      edits.push({ oldF, newF, moved, text, changes });
      rewriteCount += changes.length;
    }
  }

  // package.json bin/scripts references to moved files.
  const pkgEdits = planPackageJson(repoRoot, moves);

  return {
    moves: moves.map((m) => ({ from: m.from, to: m.to })),
    moved_files: edits.filter((e) => e.moved).length,
    files_touched: edits.length,
    require_rewrites: rewriteCount,
    edits,
    pkgEdits,
  };
}

function planPackageJson(repoRoot, moves) {
  const pkgPath = path.join(repoRoot, "package.json");
  if (!fs.existsSync(pkgPath)) return null;
  let text = fs.readFileSync(pkgPath, "utf8");
  const replacements = [];
  for (const m of moves) {
    const fromPosix = m.from.split(path.sep).join("/");
    const toPosix = m.to.split(path.sep).join("/");
    if (text.includes(fromPosix)) {
      replacements.push({ from: fromPosix, to: toPosix });
    }
  }
  return replacements.length ? { pkgPath, replacements } : null;
}

// Apply the plan to disk.
function applyReorganize(repoRoot, plan) {
  // 1. Write each file's updated content to its NEW location.
  for (const e of plan.edits) {
    fs.mkdirSync(path.dirname(e.newF), { recursive: true });
    fs.writeFileSync(e.newF, e.text, "utf8");
  }
  // 2. Remove old files that moved (after the new copy is written).
  for (const e of plan.edits) {
    if (e.moved && fs.existsSync(e.oldF)) fs.unlinkSync(e.oldF);
  }
  // 3. Update package.json references.
  if (plan.pkgEdits) {
    let text = fs.readFileSync(plan.pkgEdits.pkgPath, "utf8");
    for (const r of plan.pkgEdits.replacements) {
      text = text.split(r.from).join(r.to);
    }
    fs.writeFileSync(plan.pkgEdits.pkgPath, text, "utf8");
  }
}

// Verify no relative require is left dangling after a (planned or applied) layout.
// Uses the plan's intended final locations so it can validate a dry run too.
function verifyPlan(repoRoot, plan) {
  const finalText = new Map(); // finalAbs -> text
  const movedFrom = new Set(plan.edits.filter((e) => e.moved).map((e) => path.resolve(e.oldF)));
  for (const e of plan.edits) finalText.set(path.resolve(e.newF), e.text);

  // Snapshot of which files exist in the final layout.
  const existing = new Set(listJsFiles(repoRoot).map((f) => path.resolve(f)));
  for (const e of plan.edits) {
    if (e.moved) { existing.delete(path.resolve(e.oldF)); existing.add(path.resolve(e.newF)); }
  }

  const broken = [];
  for (const absFinal of existing) {
    const text = finalText.has(absFinal)
      ? finalText.get(absFinal)
      : (movedFrom.has(absFinal) ? null : safeRead(absFinal));
    if (text == null) continue;
    const dir = path.dirname(absFinal);
    let m;
    REQUIRE_RE.lastIndex = 0;
    while ((m = REQUIRE_RE.exec(text)) !== null) {
      const spec = m[2];
      const base = path.resolve(dir, spec);
      const cands = [base, base + ".js", base + ".json", path.join(base, "index.js")].map((c) => path.resolve(c));
      const ok = cands.some((c) => existing.has(c) || fs.existsSync(c));
      if (!ok) broken.push({ file: path.relative(repoRoot, absFinal).split(path.sep).join("/"), spec, targetKey: base });
    }
  }
  return broken;
}

// Broken requires that already exist in the CURRENT layout, keyed by the absolute
// path the require intends to resolve to. Used to ignore pre-existing breakage so
// the operation only guards against breakage IT introduces.
function baselineBrokenTargets(repoRoot) {
  const targets = new Set();
  for (const f of listJsFiles(repoRoot)) {
    const text = safeRead(f);
    if (text == null) continue;
    const dir = path.dirname(f);
    let m;
    REQUIRE_RE.lastIndex = 0;
    while ((m = REQUIRE_RE.exec(text)) !== null) {
      if (!resolveTarget(dir, m[2])) targets.add(path.resolve(dir, m[2]));
    }
  }
  return targets;
}

// Only the broken requires the plan would NEWLY introduce (excludes pre-existing).
function newlyBroken(repoRoot, plan) {
  const baseline = baselineBrokenTargets(repoRoot);
  return verifyPlan(repoRoot, plan).filter((b) => !baseline.has(b.targetKey));
}

function safeRead(abs) {
  try { return fs.readFileSync(abs, "utf8"); } catch (_e) { return null; }
}

module.exports = { planReorganize, applyReorganize, verifyPlan, newlyBroken, baselineBrokenTargets, listJsFiles, resolveTarget, toSpec };
