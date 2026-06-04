// warehouse:file
// responsibility: Exports agent prompt builders
// actor: core_runtime
// role: agent_guidance
// source_truth: implementation

const { buildBuilderPrompt } = require("./builder-prompt");
const { buildReviewerPrompt } = require("./reviewer-prompt");

module.exports = { buildBuilderPrompt, buildReviewerPrompt };
