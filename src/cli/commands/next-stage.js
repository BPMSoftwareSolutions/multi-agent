// warehouse:file
// responsibility: Next-stage command handler: validates, advances stage, and renders output
// actor: cli
// role: orchestrator
// source_truth: implementation

const { validateNextStage } = require("./next-stage-validator");
const { executeNextStage } = require("./next-stage-executor");
const { renderNextStageOutput } = require("./next-stage-renderer");
const { exit } = require("../print");

// warehouse:method
// responsibility: Orchestrates session validation, stage advancement, and output rendering
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function nextStage(sessionId = null, options = {}) {
  try {
    const { id, session } = validateNextStage(sessionId);
    const nextStageId = await executeNextStage(session);
    const output = renderNextStageOutput(session, nextStageId, options);
    console.log(output);
    return session;
  } catch (error) {
    exit(
      error.message.includes("final stage") ? 1 : error.message.includes("must be accepted") ? 1 : 2,
      `Error: ${error.message}`
    );
  }
}

module.exports = { nextStage };
