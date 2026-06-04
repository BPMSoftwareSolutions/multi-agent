// warehouse:file
// responsibility: Normalizes raw brief text into structured intent format via Claude
// actor: cli
// role: transformer
// source_truth: implementation

const { normalizeIntent } = require("../../core/run-round");

// warehouse:method
// responsibility: Calls Claude API to normalize brief into structured intent with task_definition
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function normalizeSessionIntent(brief, apiKey) {
  const intent = await normalizeIntent(brief, apiKey);
  return intent;
}

module.exports = { normalizeSessionIntent };
