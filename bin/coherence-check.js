#!/usr/bin/env node
// warehouse:file
// responsibility: Enforces changed file coherence governance by extracting taxonomy evaluating anchors requiring perfect scores and reporting failures
// actor: coherence_governance
// role: validator
// source_truth: implementation

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { extractFromFile } = require("../src/taxonomy/extractor");
const { evaluateFileCoherence } = require("../src/story-analysis/coherence-evaluator");

// warehouse:method
// responsibility: Enforces changed file coherence governance by extracting taxonomy evaluating anchors requiring perfect scores and reporting failures
// actor: method_implementation
// role: implementation
// source_truth: implementation
function runCoherenceCheck() {
  const root = path.resolve(__dirname, "..");
  const args = process.argv.slice(2);
  const changedOnly = args.includes("--changed");
  const explicitFiles = args.filter((arg) => !arg.startsWith("--"));
  const files = changedOnly
    ? [
        execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: root, encoding: "utf8" }),
        execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { cwd: root, encoding: "utf8" }),
      ]
        .join("\n")
        .split(/\r?\n/)
        .filter((file) => file.endsWith(".js"))
        .filter((file) => fs.existsSync(path.resolve(root, file)))
    : explicitFiles;

  if (files.length === 0) {
    console.log("No JavaScript files to check.");
    return 0;
  }

  const failures = [];
  for (const file of files) {
    const absPath = path.resolve(root, file);
    const taxonomy = extractFromFile(absPath, root);
    if (!taxonomy) {
      failures.push({ file, reason: "missing taxonomy" });
      console.log(`${file}: missing taxonomy`);
      continue;
    }
    const analysis = evaluateFileCoherence(taxonomy);
    const result = `${analysis.coherenceScore}/100`;
    console.log(`${file}: ${result}`);
    if (analysis.coherenceScore !== 100) {
      failures.push({ file, reason: result, issues: analysis.issues });
    }
  }

  if (failures.length > 0) {
    console.error(`Coherence check failed for ${failures.length} file(s). Self-heal required before commit.`);
    return 1;
  }

  console.log("Coherence check passed.");
  return 0;
}

if (require.main === module) {
  process.exit(runCoherenceCheck());
}

module.exports = { runCoherenceCheck };
