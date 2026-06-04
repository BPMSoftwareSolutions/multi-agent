// warehouse:file
// responsibility: Generates and persists taxonomy tracking JSON from scan results with reporting — generateTracking and Writes tracking JSON to output file with directory creation and Formats and outputs tracking summary in human or JSON format
// actor: worker_bee_infrastructure
// role: tracking_generator
// source_truth: implementation

const path = require("path");
const fs = require("fs");
const { serializeWork } = require("./scan");

// warehouse:method
// responsibility: Generates and persists taxonomy tracking JSON from scan results with reporting — generateTracking and Writes tracking JSON to output file with directory creation and Formats and outputs tracking summary in human or JSON format
// actor: method_implementation
// role: implementation
// source_truth: implementation
function generateTracking(args, scanResults, repoRoot, target) {
  const { totalPython, trustworthy, work } = scanResults;

  const fileUntouched = work.filter((w) => w.doFile).length;
  const methodsUntouched = work.reduce((n, w) => n + w.methodsNeeding.length, 0);

  return {
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
}

// warehouse:method
// responsibility: Generates and persists taxonomy tracking JSON from scan results with reporting — generateTracking and Writes tracking JSON to output file with directory creation and Formats and outputs tracking summary in human or JSON format
// actor: method_implementation
// role: implementation
// source_truth: implementation
function writeTracking(tracking, outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(tracking, null, 2), "utf8");
}

// warehouse:method
// responsibility: Generates and persists taxonomy tracking JSON from scan results with reporting — generateTracking and Writes tracking JSON to output file with directory creation and Formats and outputs tracking summary in human or JSON format
// actor: method_implementation
// role: implementation
// source_truth: implementation
function reportTracking(tracking, outputPath, asJson) {
  if (asJson) {
    console.log(JSON.stringify(tracking.summary, null, 2));
  } else {
    const s = tracking.summary;
    console.log(`Taxonomy scan — ${tracking.target}  (layer: ${tracking.layer})`);
    console.log(`  python files:        ${s.total_python}`);
    console.log(`  touched (trustworthy):   ${s.touched_files}`);
    console.log(`  UNTOUCHED files:         ${s.untouched_files}`);
    console.log(`    - file anchors untouched: ${s.file_anchors_untouched}`);
    console.log(`    - method anchors untouched: ${s.methods_untouched}`);
    console.log(`  tracking written: ${outputPath}`);
    console.log(`  drive the bee with: node bin/worker-bee.js --from ${path.relative(path.join(__dirname, ".."), outputPath).split(path.sep).join("/")}`);
  }
}

module.exports = { generateTracking, writeTracking, reportTracking };
