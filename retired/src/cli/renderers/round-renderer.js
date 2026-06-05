// warehouse:file
// responsibility: Dispatches round rendering to JSON or text format based on options
// actor: cli
// role: renderer
// source_truth: implementation

const { renderRoundJson } = require("./round-json-renderer");
const { renderRoundText } = require("./round-text-renderer");

// warehouse:method
// responsibility: Dispatches round rendering to JSON or text format based on options
// actor: method_implementation
// role: implementation
// source_truth: implementation
function renderRound(round, options = {}) {
  const json = options.json || false;
  return json ? renderRoundJson(round, options) : renderRoundText(round);
}

module.exports = { renderRound };
