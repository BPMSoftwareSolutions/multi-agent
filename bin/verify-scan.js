#!/usr/bin/env node
// Deterministic scan verifier: re-scan target and verify reported counts

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
for (const name of [".env.local", ".env"]) {
  const p = path.join(root, name);
  if (fs.existsSync(p)) require("dotenv").config({ path: p });
}

const config = JSON.parse(fs.readFileSync(path.join(root, ".worker-bee.json"), "utf8"));
const DEFAULT_REPO_ROOT = process.env.WORKER_BEE_REPO_ROOT || config.repoRoot || "C:/source/repos/bpm/internal/ai-engine";
const DEFAULT_TARGET = path.resolve(DEFAULT_REPO_ROOT, config.defaultTarget || "packages");

function walk(dir, ext = ".py") {
  const files = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...walk(fullPath, ext));
      } else if (entry.isFile() && entry.name.endsWith(ext)) {
        files.push(fullPath);
      }
    }
  } catch (_e) {
    /* skip inaccessible dirs */
  }
  return files;
}

function readAnchor(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");
    const anchor = {};
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("#")) break;
      const match = trimmed.match(/^#\s*(\w+):\s*(.+)$/);
      if (match) {
        anchor[match[1]] = match[2].trim();
      }
    }
    return anchor;
  } catch (_e) {
    return {};
  }
}

function isPlaceholder(anchor) {
  const PLACEHOLDERS = new Set(["", "auto", "unknown", "tbd", "todo", "placeholder", "xxx"]);
  const responsibility = (anchor.responsibility || "").toLowerCase();
  if (PLACEHOLDERS.has(responsibility)) return true;
  if (responsibility.includes("__init__") || responsibility.includes("noqa")) return true;
  return false;
}

function needsWork(anchor) {
  // File needs work if: no responsibility field, or responsibility is placeholder
  const hasResponsibility = "responsibility" in anchor && anchor.responsibility;
  if (!hasResponsibility) return true;
  if (isPlaceholder(anchor)) return true;
  return false;
}

async function main() {
  console.log("🔍 Deterministic Scan Verifier\n");
  console.log(`Target: ${DEFAULT_TARGET}\n`);

  const startTime = Date.now();

  // Scan all Python files
  const allFiles = walk(DEFAULT_TARGET);
  console.log(`Found ${allFiles.length} Python files\n`);

  // Classify each file
  let fullyTrustworthy = 0;
  let needsWorkCount = 0;
  const issues = [];

  for (const filePath of allFiles) {
    const anchor = readAnchor(filePath);
    if (needsWork(anchor)) {
      needsWorkCount++;
      if (!anchor.responsibility) {
        issues.push({ file: path.relative(DEFAULT_TARGET, filePath), reason: "missing responsibility" });
      } else {
        issues.push({ file: path.relative(DEFAULT_TARGET, filePath), reason: `placeholder: "${anchor.responsibility}"` });
      }
    } else {
      fullyTrustworthy++;
    }
  }

  const elapsed = Date.now() - startTime;

  // Load current status
  const statusFile = path.join(root, "reports", "status-latest.json");
  let reportedStatus = null;
  try {
    reportedStatus = JSON.parse(fs.readFileSync(statusFile, "utf8"));
  } catch (_e) {
    /* no status file */
  }

  console.log("═════════════════════════════════════════════════════════════════════════");
  console.log("Results:");
  console.log("═════════════════════════════════════════════════════════════════════════\n");

  console.log(`Total Python files:  ${allFiles.length}`);
  console.log(`Fully trustworthy:   ${fullyTrustworthy}`);
  console.log(`Needs work:          ${needsWorkCount}`);
  console.log(`Scan time:           ${elapsed}ms\n`);

  if (reportedStatus && reportedStatus.target === DEFAULT_TARGET) {
    console.log("═════════════════════════════════════════════════════════════════════════");
    console.log("Comparison with Latest Status Report:");
    console.log("═════════════════════════════════════════════════════════════════════════\n");

    const reported = reportedStatus.totals;
    const match = {
      total: allFiles.length === reported.total_python,
      trustworthy: fullyTrustworthy === (reported.total_python - reported.needs_work),
      needsWork: needsWorkCount === reported.needs_work,
    };

    console.log(`Total Python Files:`);
    console.log(`  Reported:  ${reported.total_python} ${match.total ? "✅" : "❌"}`);
    console.log(`  Scanned:   ${allFiles.length}\n`);

    console.log(`Fully Trustworthy:`);
    console.log(`  Reported:  ${reported.total_python - reported.needs_work} ${match.trustworthy ? "✅" : "❌"}`);
    console.log(`  Scanned:   ${fullyTrustworthy}\n`);

    console.log(`Needs Work:`);
    console.log(`  Reported:  ${reported.needs_work} ${match.needsWork ? "✅" : "❌"}`);
    console.log(`  Scanned:   ${needsWorkCount}\n`);

    const allMatch = Object.values(match).every((v) => v);
    if (allMatch) {
      console.log("✅ All numbers match! Status report is accurate.\n");
    } else {
      console.log("❌ Discrepancy detected! Numbers do not match.\n");
    }
  } else {
    console.log("⏭️  No matching status report found (target mismatch or no status file)\n");
  }

  // Show sample of files needing work
  if (issues.length > 0 && issues.length <= 20) {
    console.log("Files needing work:");
    issues.forEach((issue) => {
      console.log(`  - ${issue.file} (${issue.reason})`);
    });
  } else if (issues.length > 20) {
    console.log(`Sample of files needing work (showing 10 of ${issues.length}):`);
    issues.slice(0, 10).forEach((issue) => {
      console.log(`  - ${issue.file} (${issue.reason})`);
    });
    console.log(`  ... and ${issues.length - 10} more\n`);
  }
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
