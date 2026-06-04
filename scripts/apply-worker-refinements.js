#!/usr/bin/env node
// warehouse:file
// responsibility: Coordinates apply worker refinements module behavior with documented file taxonomy evidence
// actor: maintenance_script
// role: implementation
// source_truth: implementation

// Apply Worker 1 refinements (27 files)

const fs = require('fs');
const { execSync } = require('child_process');

const worker1 = {
  "src/audit/auditor.js": { "responsibility": "Evaluates JavaScript files for taxonomy header completeness and classification status", "methods": { "auditFiles": "Scans and classifies JavaScript files by taxonomy header completeness (complete, partial, missing)" } },
  "src/audit/header-parser.js": { "responsibility": "Parses and validates taxonomy header metadata from JavaScript file comment blocks", "methods": { "readHeader": "Extracts taxonomy header fields from JavaScript comments into key-value object", "isComplete": "Validates that all required header fields (warehouse, responsibility, actor, role) are populated" } },
  "src/cli/cli-router.js": { "responsibility": "Dispatches CLI commands to their corresponding handler modules", "methods": { "routeCommand": "Routes parsed CLI command to appropriate handler function based on command name" } },
  "src/cli/commands/approval-processor.js": { "responsibility": "Processes and queues action approval payloads to session operations", "methods": { "parsePayload": "Parses approval payload from JSON string or file source", "queueApprovedAction": "Routes approved action to session operations queue with metadata" } },
  "src/cli/commands/next-stage.js": { "responsibility": "Handles next-stage command: validates readiness and advances session workflow", "methods": { "nextStage": "Validates current stage state and advances session to next workflow stage" } },
  "src/cli/commands/run-worker.js": { "responsibility": "Executes pending worker actions by loading session, executing handlers, and persisting results", "methods": { "runWorkerCommand": "Loads session, executes pending action, records result in attempt log, saves session" } },
  "src/cli/commands/show.js": { "responsibility": "Renders current session state with all stages and operation history", "methods": { "show": "Retrieves current session and renders complete state for CLI display" } },
  "src/cli/commands/status.js": { "responsibility": "Summarizes pending, running, and completed operations in current session", "methods": { "status": "Retrieves session and outputs operation status summary in JSON or text format" } },
  "src/cli/commands/worker-session-loader.js": { "responsibility": "Resolves and loads session context for worker command execution", "methods": { "loadWorkerSession": "Resolves session ID from options or context, loads and validates session" } },
  "src/cli/print.js": { "responsibility": "Exports CLI output functions for rendering sessions, rounds, artifacts, and process exit", "methods": { "renderArtifact": "Formats artifact object for human-readable CLI display", "renderSession": "Renders complete session state with stages and artifact progression", "renderRound": "Formats round results with planner and reviewer outputs for display", "exit": "Outputs exit message and terminates process with specified exit code" } },
  "src/core/llm-modules/http-transport.js": { "responsibility": "Handles HTTPS requests to language model API endpoints with error handling", "methods": { "fetchFromAnthropicRaw": "Executes HTTPS request to LLM API, handles errors, returns parsed JSON response" } },
  "src/core/llm-modules/model-caller.js": { "responsibility": "Invokes Claude API with system context and messages, extracts response text", "methods": { "callClaude": "Calls Claude API with prompts, extracts response text from result" } },
  "src/core/llm-modules/model-invoker.js": { "responsibility": "Sends messages to language model API and returns raw response", "methods": { "invokeModel": "Calls language model API with system prompt and user messages, returns response" } },
  "src/core/prompt-builders.js": { "responsibility": "Aggregates prompt construction by delegating to specialized prompt builder modules", "methods": { "buildBuilderPrompt": "Constructs planner agent prompt combining stage goals and task intent", "buildReviewerPrompt": "Constructs reviewer agent prompt for artifact evaluation" } },
  "src/core/prompts/agent-prompters.js": { "responsibility": "Builds planner and reviewer agent prompts for artifact development", "methods": { "buildBuilderPrompt": "Constructs planner prompt from stage goals, task intent, artifact, and feedback", "buildReviewerPrompt": "Constructs reviewer prompt to evaluate proposed artifact changes" } },
  "src/core/prompts/context-builder.js": { "responsibility": "Formats previous round context for agent prompts with interjection handling", "methods": { "buildRoundContext": "Formats round context including interjection, change summary, artifact state", "formatHumanInterjection": "Normalizes and formats human interjection text for prompt injection" } },
  "src/core/prompts/reviewer-prompt.js": { "responsibility": "Constructs reviewer agent prompt for artifact evaluation against task intent", "methods": { "buildReviewerPrompt": "Builds prompt for reviewer to assess artifact alignment with task goals" } },
  "src/core/prompts/reviewer-prompter.js": { "responsibility": "Creates reviewer agent prompts for artifact validation and issue detection", "methods": { "buildReviewerPrompt": "Constructs prompt for reviewer to identify alignment issues in artifacts" } },
  "src/core/prompts/schema-formatter.js": { "responsibility": "Converts schema objects to human-readable field descriptions for prompts", "methods": { "schemaToText": "Converts schema definition to readable field descriptions", "toJSONString": "Serializes values to formatted JSON for prompt embedding" } },
  "src/core/round-modules/artifact-acceptor.js": { "responsibility": "Manages artifact acceptance and routes action recommendations for execution", "methods": { "acceptArtifact": "Accepts proposed artifact as current state and queues action recommendations" } },
  "src/core/round-modules/round-executor.js": { "responsibility": "Orchestrates design workshop rounds by executing planner and reviewer agents", "methods": { "runRound": "Executes planner and reviewer agents sequentially, stores round results" } },
  "src/packages/contradiction-detector.js": { "responsibility": "Detects package-level taxonomy contradictions and role/actor inconsistencies", "methods": { "analyzePackages": "Groups files by package and detects contradictions", "detectContradictions": "Identifies naming-responsibility mismatches and role inconsistencies" } },
  "src/reports/markdown-renderer.js": { "responsibility": "Generates markdown-formatted reports of worker-bee run results", "methods": { "renderMarkdown": "Renders aggregated run results as markdown with summary tables" } },
  "src/shared/actions-modules/action-builder.js": { "responsibility": "Constructs action and review queue items from normalized recommendations", "methods": { "buildApprovedAction": "Creates action object from recommendation with tracking metadata", "buildReviewItem": "Creates human review queue item from recommendation" } },
  "src/shared/actions-modules/action-executor.js": { "responsibility": "Executes pending actions with file validation, applies mutations, logs attempts", "methods": { "failAttempt": "Records action execution failure in attempt log", "runWorker": "Executes pending action, applies mutations, records attempt lifecycle", "summarizeOperations": "Aggregates action execution counts and metrics by status" } },
  "src/shared/actions-modules/action-queuer.js": { "responsibility": "Routes and deduplicates actions and review items in operation queues", "methods": { "queueHumanReviewItem": "Routes review item to queue with deduplication", "queueActionRecommendations": "Routes recommendations through normalization and deduplication", "approveManualAction": "Wraps manual recommendation for CLI-driven approval workflow" } },
  "src/shared/actions-modules/operations-summarizer.js": { "responsibility": "Summarizes action operations with aggregate metrics and attempt tracking", "methods": { "summarizeOperations": "Aggregates action execution counts by status, returns metrics" } }
};

const expected = JSON.parse(fs.readFileSync('reports/expected_taxonomy.json', 'utf8'));

let applied = 0;
for (const file of expected.files) {
  if (worker1[file.path]) {
    file.responsibility = worker1[file.path].responsibility;
    file.methods = worker1[file.path].methods;
    applied++;
  }
}

fs.writeFileSync('reports/expected_taxonomy.json', JSON.stringify(expected, null, 2), 'utf8');
console.log(`✅ Applied ${applied} Worker 1 refinements`);

// Apply
execSync('node scripts/update-anchors.js reports/expected_taxonomy.json 2>&1 | tail -3', { stdio: 'inherit' });

// Measure
console.log('\n📊 Measuring coherence...\n');
execSync('node bin/generate-story-report.js 2>&1 | tail -6', { stdio: 'inherit' });
