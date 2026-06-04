// warehouse:file
// responsibility: Round command handler: validates session, executes round, and renders output
// actor: cli
// role: orchestrator
// source_truth: implementation

const { lookupSession } = require("./session-lookup");
const { executeRound } = require("./round-executor");
const { renderRoundOutput } = require("./round-renderer");
const { exit } = require("../print");

// warehouse:method
// responsibility: Orchestrates session lookup, round execution, and output rendering
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function round(note = "", apiKey = null, options = {}) {
  try {
    const sessionId = options.sessionId || options.session;
    const session = lookupSession(sessionId);

    if (session.completed) {
      exit(1, "Error: Session is already completed. Cannot run more rounds.");
    }

    console.log(
      `\nRunning round ${session.stages[session.currentStage].rounds.length + 1}...`
    );

    const { roundNumber, round: roundData } = await executeRound(session, apiKey, note || "");
    const output = renderRoundOutput(session, roundNumber, roundData, options);
    console.log(output);

    return session;
  } catch (error) {
    exit(2, `Error: ${error.message}`);
  }
}

module.exports = { round };
