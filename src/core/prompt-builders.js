// warehouse:file
// responsibility: Delegator: CLI aggregator for agent prompt generation - routes to focused prompt modules
// actor: core_runtime
// role: entry_point
// source_truth: implementation

const { STAGES } = require("./stages");
const { schemaToText, toJSONString } = require("./prompts/schema-formatter");
const { buildRoundContext, formatHumanInterjection } = require("./prompts/context-builder");
const { buildIntentPrompt } = require("./prompts/intent-prompter");
const { buildBuilderPrompt } = require("./prompts/builder-prompter");
const { buildReviewerPrompt } = require("./prompts/reviewer-prompter");

module.exports = {
  schemaToText,
  toJSONString,
  buildRoundContext,
  formatHumanInterjection,
  buildIntentPrompt,
  buildBuilderPrompt,
  buildReviewerPrompt
};
