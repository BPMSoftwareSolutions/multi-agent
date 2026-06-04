#!/usr/bin/env node
// warehouse:file
// responsibility: Studio CLI entry point: loads environment config, parses command-line arguments, routes to command handlers for session and round management
// actor: studio_cli
// role: command_router
// source_truth: implementation

require("dotenv").config();
require("dotenv").config({ path: ".env.local", override: true });
require("dotenv").config({ path: "bin/.env.local", override: false });

const path = require("path");
const { start } = require("../src/cli/commands/start");
const { show } = require("../src/cli/commands/show");
const { round } = require("../src/cli/commands/round");
const { accept } = require("../src/cli/commands/accept");
const { nextStage } = require("../src/cli/commands/next-stage");
const { status } = require("../src/cli/commands/status");
const { runWorkerCommand } = require("../src/cli/commands/run-worker");
const { approveActionCommand } = require("../src/cli/commands/approve-action");
const { exit } = require("../src/cli/print");

// warehouse:method
// responsibility: Routes CLI command dispatch to appropriate handler based on command argument
// actor: command_router
// role: orchestrator
// source_truth: implementation
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;

  if (!command) {
    console.log(`
Usage: studio <command> [options]

Commands:
  start <brief>          Start a new session with a brief
  show                   Show current session state
  round [--note NOTE]    Run a planner/reviewer round
  accept                 Accept the proposed artifact
  next-stage             Advance to the next stage
  status                 Show machine-friendly status
  approve-action         Queue a manual approved action from JSON payload
  run-worker [actionId]  Execute the next approved action or a specific action

Options:
  --json                 Output as JSON
  --note TEXT            Human interjection note (for round command)
  --session ID           Specify a session ID (if not current)
  --payload JSON         Structured action payload (for approve-action)
  --payload-file PATH    Path to a JSON file with the action payload

Examples:
  studio start "Build a mobile app with two AI agents"
  studio round --note "Make it simpler"
  studio show
  studio status --json
  studio approve-action --payload-file action.json
  studio accept
  studio next-stage
  studio run-worker
`);
    exit(0);
  }

  try {
    const options = parseOptions(args.slice(1));

    switch (command) {
      case "start": {
        const brief = options.positional[0];
        if (!brief) {
          exit(1, "Error: brief is required. Usage: studio start <brief>");
        }
        await start(brief, apiKey, options);
        break;
      }

      case "show": {
        const sessionId = options.positional[0];
        await show(sessionId, options);
        break;
      }

      case "round": {
        const note = options.note || "";
        await round(note, apiKey, options);
        break;
      }

      case "accept": {
        const sessionId = options.positional[0];
        await accept(sessionId, options);
        break;
      }

      case "next-stage": {
        const sessionId = options.positional[0];
        await nextStage(sessionId, options);
        break;
      }

      case "status": {
        const sessionId = options.positional[0];
        await status(sessionId, options);
        break;
      }

      case "approve-action": {
        await approveActionCommand(options);
        break;
      }

      case "run-worker": {
        const actionId = options.positional[0] || null;
        await runWorkerCommand(actionId, options);
        break;
      }

      default: {
        exit(1, `Unknown command: ${command}`);
      }
    }
  } catch (error) {
    exit(2, `Fatal error: ${error.message}`);
  }
}

// warehouse:method
// responsibility: Parses command-line arguments into options object with positional and named parameters
// actor: argument_parser
// role: config_builder
// source_truth: implementation
function parseOptions(args) {
  const options = {
    positional: [],
    json: false,
    note: null,
    session: null,
    payload: null,
    payloadFile: null
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--json") {
      options.json = true;
    } else if (arg === "--note" && i + 1 < args.length) {
      options.note = args[++i];
    } else if (arg === "--session" && i + 1 < args.length) {
      options.session = args[++i];
      options.sessionId = args[i];
    } else if (arg === "--payload" && i + 1 < args.length) {
      options.payload = args[++i];
    } else if (arg === "--payload-file" && i + 1 < args.length) {
      options.payloadFile = args[++i];
    } else if (!arg.startsWith("--")) {
      options.positional.push(arg);
    }
  }

  return options;
}

main().catch((error) => {
  exit(2, `Uncaught error: ${error.message}`);
});
