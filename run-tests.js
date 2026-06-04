#!/usr/bin/env node
// warehouse:file
// responsibility: Coordinates runCommand and main and generateReport behavior with documented file and method taxonomy evidence
// actor: application_module
// role: implementation
// source_truth: implementation


const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const RESULTS_DIR = path.join(__dirname, "test-results");
const TEST_START_TIME = new Date().toISOString();

// Ensure test-results directory exists
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

const results = {
  testStartTime: TEST_START_TIME,
  commands: [],
  summary: {
    totalCommands: 0,
    succeeded: 0,
    failed: 0
  }
};

// warehouse:method
// responsibility: Coordinates runCommand and main and generateReport behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function runCommand(name, command, description = "") {
  const startTime = Date.now();
  const cmdStartISO = new Date(startTime).toISOString();

  console.log(`\n[${name}] Running: ${command}`);

  let stdout = "";
  let stderr = "";
  let exitCode = 0;
  let error = null;

  try {
    stdout = execSync(command, {
      cwd: __dirname,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"]
    });
  } catch (e) {
    exitCode = e.status || 1;
    stdout = e.stdout ? e.stdout.toString() : "";
    stderr = e.stderr ? e.stderr.toString() : "";
    error = e.message;
  }

  const duration = Date.now() - startTime;
  const success = exitCode === 0;

  if (success) {
    results.summary.succeeded++;
    console.log(`✓ Success (${duration}ms)`);
  } else {
    results.summary.failed++;
    console.log(`✗ Failed with exit code ${exitCode} (${duration}ms)`);
  }

  const result = {
    name,
    command,
    description,
    timestamp: cmdStartISO,
    durationMs: duration,
    exitCode,
    success,
    stdout: stdout.trim(),
    stderr: stderr.trim(),
    error
  };

  results.commands.push(result);

  // Save individual result
  const filename = `${name.toLowerCase().replace(/\s+/g, "-")}.json`;
  fs.writeFileSync(
    path.join(RESULTS_DIR, filename),
    JSON.stringify(result, null, 2)
  );

  return result;
}

// warehouse:method
// responsibility: Coordinates runCommand and main and generateReport behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function main() {
  console.log("=== Multi-Agent Studio CLI Test Suite ===");
  console.log(`Start time: ${TEST_START_TIME}\n`);

  const brief =
    "Build a single-page workshop app where two AI agents debate a product idea and the human can intervene each round";

  // Test 1: Start session
  runCommand("test-01-start", `node bin/studio.js start "${brief}"`, "Create a new session");

  // Get session ID from current session file
  let sessionId = null;
  try {
    const currentFile = path.join(__dirname, ".studio", "current-session.json");
    if (fs.existsSync(currentFile)) {
      const current = JSON.parse(fs.readFileSync(currentFile, "utf8"));
      sessionId = current.sessionId;
    }
  } catch (e) {
    console.error("Failed to read current session ID");
  }

  // Test 2: Show initial state
  runCommand(
    "test-02-show-initial",
    "node bin/studio.js show",
    "Display initial session state"
  );

  // Test 3: Run round 1
  runCommand(
    "test-03-round-1",
    'node bin/studio.js round --note "Keep the interaction model simple and testable"',
    "Execute first round (builder/reviewer/synthesizer)"
  );

  // Test 4: Check status
  runCommand("test-04-status-round-1", "node bin/studio.js status --json", "Check status after round 1");

  // Test 5: Accept artifact
  runCommand("test-05-accept", "node bin/studio.js accept", "Accept the idea stage artifact");

  // Test 6: Advance to next stage
  runCommand("test-06-next-stage", "node bin/studio.js next-stage", "Advance to ASCII sketch stage");

  // Test 7: Show state at ASCII stage
  runCommand(
    "test-07-show-ascii",
    "node bin/studio.js show",
    "Display state at ASCII sketch stage"
  );

  // Test 8: Run round 2 (ASCII)
  runCommand(
    "test-08-round-2-ascii",
    'node bin/studio.js round --note "Create a simple 3-column layout with navigation, content, and sidebar"',
    "Execute second round at ASCII stage"
  );

  // Test 9: Accept ASCII artifact
  runCommand("test-09-accept-ascii", "node bin/studio.js accept", "Accept the ASCII sketch");

  // Test 10: Advance to plan stage
  runCommand(
    "test-10-next-stage-plan",
    "node bin/studio.js next-stage",
    "Advance to Implementation Plan stage"
  );

  // Test 11: Show state at plan stage
  runCommand("test-11-show-plan", "node bin/studio.js show", "Display state at plan stage");

  // Test 12: Run round 3 (Plan)
  runCommand(
    "test-12-round-3-plan",
    'node bin/studio.js round --note "List frontend components, backend endpoints, and implementation milestones"',
    "Execute third round at plan stage"
  );

  // Test 13: Accept plan artifact
  runCommand("test-13-accept-plan", "node bin/studio.js accept", "Accept the implementation plan");

  // Test 14: Advance to completion
  runCommand(
    "test-14-complete",
    "node bin/studio.js next-stage",
    "Mark session as completed"
  );

  // Test 15: Final status
  runCommand("test-15-final-status", "node bin/studio.js status --json", "Check final status");

  // Test 16: Final full state
  runCommand("test-16-final-show", "node bin/studio.js show", "Display final session state");

  // Finalize results
  results.summary.totalCommands = results.commands.length;
  results.testEndTime = new Date().toISOString();
  results.duration = new Date(results.testEndTime) - new Date(TEST_START_TIME);

  // Save overall summary
  fs.writeFileSync(
    path.join(RESULTS_DIR, "summary.json"),
    JSON.stringify(results, null, 2)
  );

  // Save human-readable report
  const report = generateReport(results);
  fs.writeFileSync(path.join(RESULTS_DIR, "report.txt"), report);

  // Print summary
  console.log("\n\n=== Test Summary ===");
  console.log(`Total commands: ${results.summary.totalCommands}`);
  console.log(`Succeeded: ${results.summary.succeeded}`);
  console.log(`Failed: ${results.summary.failed}`);
  console.log(
    `Duration: ${(results.duration / 1000).toFixed(1)}s`
  );
  console.log(`\nResults saved to: ${RESULTS_DIR}`);
  console.log(`Summary: ${path.join(RESULTS_DIR, "summary.json")}`);
  console.log(`Report: ${path.join(RESULTS_DIR, "report.txt")}`);

  const allPassed = results.summary.failed === 0;
  process.exit(allPassed ? 0 : 1);
}

// warehouse:method
// responsibility: Coordinates runCommand and main and generateReport behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function generateReport(results) {
  const lines = [
    "=== Multi-Agent Studio CLI Test Report ===",
    `Test Start: ${results.testStartTime}`,
    `Test End: ${results.testEndTime}`,
    `Total Duration: ${(results.duration / 1000).toFixed(1)}s`,
    "",
    `Summary:`,
    `  Total Commands: ${results.summary.totalCommands}`,
    `  Succeeded: ${results.summary.succeeded}`,
    `  Failed: ${results.summary.failed}`,
    ""
  ];

  results.commands.forEach((cmd, idx) => {
    lines.push(
      `[${String(idx + 1).padStart(2, "0")}] ${cmd.name} - ${cmd.success ? "✓ PASS" : "✗ FAIL"}`
    );
    if (cmd.description) {
      lines.push(`      Description: ${cmd.description}`);
    }
    lines.push(`      Command: ${cmd.command}`);
    lines.push(`      Duration: ${cmd.durationMs}ms`);
    lines.push(`      Exit Code: ${cmd.exitCode}`);

    if (cmd.stdout) {
      const preview = cmd.stdout.substring(0, 200).replace(/\n/g, "\n      ");
      lines.push(`      Output: ${preview}${cmd.stdout.length > 200 ? "..." : ""}`);
    }

    if (cmd.error) {
      lines.push(`      Error: ${cmd.error}`);
    }

    lines.push("");
  });

  lines.push("=== Files Generated ===");
  results.commands.forEach((cmd) => {
    const filename = `${cmd.name.toLowerCase().replace(/\s+/g, "-")}.json`;
    lines.push(`  - ${filename}`);
  });
  lines.push("  - summary.json");
  lines.push("  - report.txt");

  return lines.join("\n");
}

main().catch((error) => {
  console.error("Test suite error:", error.message);
  process.exit(2);
});
