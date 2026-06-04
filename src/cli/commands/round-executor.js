// warehouse:file
// responsibility: Executes planning and review cycle for current session round
// actor: cli
// role: executor
// source_truth: implementation

const { saveSession } = require("../../core/session-store");
const { runRound } = require("../../core/run-round");

// warehouse:method
// responsibility: Runs orchestrator round (planner + reviewer) and persists session
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function executeRound(session, apiKey, humanInterjection = "") {
  const { roundNumber, round: roundData } = await runRound({
    session,
    apiKey,
    humanInterjection
  });
  saveSession(session);
  return { roundNumber, round: roundData };
}

module.exports = { executeRound };
