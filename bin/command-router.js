// warehouse:file
// responsibility: Routes commands to handlers and executes studio workflow commands
// actor: command_orchestrator
// role: router
// source_truth: implementation

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
// responsibility: Routes command to appropriate handler and executes command workflow
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function routeAndExecuteCommand(command, options, apiKey) {
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

module.exports = { routeAndExecuteCommand };
