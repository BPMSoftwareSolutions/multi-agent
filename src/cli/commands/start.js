// warehouse:file
// responsibility: Start command handler: validates brief, creates session with intent, and renders output
// actor: cli
// role: orchestrator
// source_truth: implementation

const { validateBrief } = require("./brief-validator");
const { normalizeSessionIntent } = require("./intent-normalizer");
const { createAndSaveSession } = require("./session-creator");
const { renderStartOutput } = require("./start-renderer");
const { exit } = require("../print");

// warehouse:method
// responsibility: Orchestrates brief validation, intent normalization, session creation, and output rendering
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function start(brief, apiKey, options = {}) {
  try {
    validateBrief(brief);
    const intent = await normalizeSessionIntent(brief, apiKey);
    const session = await createAndSaveSession(brief, intent);
    const output = renderStartOutput(session, options);
    console.log(output);
    return session;
  } catch (error) {
    exit(2, `Error: ${error.message}`);
  }
}

module.exports = { start };
