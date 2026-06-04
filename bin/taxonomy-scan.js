// warehouse:file
// responsibility: CLI entrypoint for taxonomy scan—parses args and orchestrates scanning
// actor: taxonomy_scanner
// role: scan_authority
// source_truth: implementation

const path = require("path");
const fs = require("fs");

const { findWork, serializeWork } = require("../src/worker-bee/scan");
const { parseTaxonomyScanArgs } = require("../src/cli/taxonomy-scan-args");

const DEFAULT_REPO_ROOT = process.env.WORKER_BEE_REPO_ROOT;
if (!DEFAULT_REPO_ROOT) {
  console.error('❌ Missing repo root configuration. Set WORKER_BEE_REPO_ROOT env var');
  process.exit(1);
}

function main() {
  const args = parseTaxonomyScanArgs(process.argv.slice(2), DEFAULT_REPO_ROOT);
  const repoRoot = path.resolve(args.repoRoot);
  const target = path.resolve(args.target || args.repoRoot);
  if (!fs.existsSync(target)) {
    console.error(`Target does not exist: ${target}`);
    return 1;
  }

  const { totalPython, trustworthy, work } = findWork(target, repoRoot, { layer: args.layer, mode: args.mode });

  const fileUntouched = work.filter((w) => w.doFile).length;
  const methodsUntouched = work.reduce((n, w) => n + w.methodsNeeding.length, 0);

  const tracking = {
    schema: "taxonomy-tracking.v1",
    generated_at: new Date().toISOString(),
    repo_root: repoRoot.split(path.sep).join("/"),
    target: (path.relative(repoRoot, target).split(path.sep).join("/")) || ".",
    layer: args.layer,
    mode: args.mode,
    summary: {
      total_python: totalPython,
      touched_files: trustworthy,
      untouched_files: work.length,
      file_anchors_untouched: fileUntouched,
      methods_untouched: methodsUntouched,
    },
    work: serializeWork(work),
  };

  const out = path.resolve(args.output || path.join(__dirname, "..", "reports", "taxonomy-tracking.json"));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(tracking, null, 2), "utf8");

  if (args.json) {
    console.log(JSON.stringify(tracking.summary, null, 2));
  } else {
    const s = tracking.summary;
    console.log(`Taxonomy scan — ${tracking.target}  (layer: ${args.layer})`);
    console.log(`  python files:        ${s.total_python}`);
    console.log(`  touched (trustworthy):   ${s.touched_files}`);
    console.log(`  UNTOUCHED files:         ${s.untouched_files}`);
    console.log(`    - file anchors untouched: ${s.file_anchors_untouched}`);
    console.log(`    - method anchors untouched: ${s.methods_untouched}`);
    console.log(`  tracking written: ${out}`);
    console.log(`  drive the bee with: node bin/worker-bee.js --from ${path.relative(path.join(__dirname, ".."), out).split(path.sep).join("/")}`);
  }
  return 0;
}

process.exit(main());
