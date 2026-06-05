// warehouse:file
// responsibility: Orchestrates session lookup, operation summary, and output rendering
// actor: cli
// role: orchestrator
// source_truth: implementation

const { lookupSession } = require("./session-lookup");
const { summarizeOperations } = require("../../shared/actions");
const { renderStatusOutput } = require("./status-renderer");
const { exit } = require("../print");

// warehouse:method
// responsibility: Orchestrates session lookup, operation summary, and output rendering
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function status(sessionId = null, options = {}) {
  try {
    const session = lookupSession(sessionId);
    const operations = summarizeOperations(session);
    const output = renderStatusOutput(session, operations);
    console.log(output);
  } catch (error) {
    const errorOutput = JSON.stringify(
      { ok: false, message: error.message },
      null,
      2
    );
    exit(0, errorOutput);
  }
}

module.exports = { status };
