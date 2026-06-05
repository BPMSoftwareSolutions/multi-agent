// warehouse:file
// responsibility: Orchestrates studio CLI by parsing command-line arguments and routing to appropriate command handlers for session, round, and workflow management
// actor: cli
// role: entry_point
// source_truth: implementation

require("dotenv").config();
require("dotenv").config({ path: ".env.local", override: true });
require("dotenv").config({ path: "bin/.env.local", override: false });

const { parseOptions } = require("./options-parser");
const { routeAndExecuteCommand } = require("../src/cli/command-router");
const { exit } = require("../src/cli/print");

// warehouse:method
// responsibility: Orchestrates studio CLI by parsing command-line arguments and routing to appropriate command handlers for session, round, and workflow management
// actor: method_implementation
// role: implementation
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
    await routeAndExecuteCommand(command, options, apiKey);
  } catch (error) {
    exit(2, `Fatal error: ${error.message}`);
  }
}

main().catch((error) => {
  exit(2, `Uncaught error: ${error.message}`);
});
