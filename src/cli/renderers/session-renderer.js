// warehouse:file
// responsibility: Dispatches session rendering to JSON or text format based on options
// actor: cli
// role: renderer
// source_truth: implementation

const { renderSessionJson } = require("./session-json-renderer");
const { renderSessionText } = require("./session-text-renderer");

// warehouse:method
// responsibility: Dispatches session rendering to JSON or text format based on options
// actor: method_implementation
// role: implementation
// source_truth: implementation
function renderSession(session, options = {}) {
  const json = options.json || false;
  return json ? renderSessionJson(session) : renderSessionText(session);
}

module.exports = { renderSession };
