// warehouse:file
// responsibility: Routes CLI commands to handlers
// actor: command_router
// role: orchestrator
// source_truth: implementation

const { start } = require("./commands/start");
const { show } = require("./commands/show");
const { round } = require("./commands/round");
const { accept } = require("./commands/accept");
const { nextStage } = require("./commands/next-stage");
const { status } = require("./commands/status");
const { runWorkerCommand } = require("./commands/run-worker");
const { approveActionCommand } = require("./commands/approve-action");
const { exit } = require("./print");

// warehouse:method
// responsibility: Routes parsed CLI command to appropriate handler function with options
// actor: command_router
// role: orchestrator
// source_truth: implementation
async function routeCommand(command, args, options, apiKey) {
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
}

module.exports = { routeCommand };
