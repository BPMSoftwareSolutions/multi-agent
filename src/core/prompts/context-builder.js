// warehouse:file
// responsibility: Builds previous round context for agent prompts with interjection handling
// actor: core_runtime
// role: context_builder
// source_truth: implementation

const { toJSONString } = require("./schema-formatter");

// warehouse:method
// responsibility: Builds previous round context by formatting round number, human interjection, change summary, and artifact state for agent prompt context
// actor: core_runtime
// role: context_builder
// source_truth: implementation
function buildRoundContext(lastRound) {
  if (!lastRound) {
    return "No previous round context available.";
  }
  const summary = Array.isArray(lastRound?.reviewer?.change_summary)
    ? lastRound.reviewer.change_summary.join("; ")
    : "No change summary available.";
  return [
    `Previous round: ${lastRound.roundNumber}`,
    `Previous human interjection: ${lastRound.humanInterjection || "(no human instruction for this round)"}`,
    `Previous accepted-to-proposed change summary: ${summary}`,
    `Latest proposed artifact:`,
    toJSONString(lastRound.artifactAfter || {})
  ].join("\n");
}

// warehouse:method
// responsibility: Validates and normalizes human interjection text, returning formatted string or default placeholder for agent prompt context
// actor: core_runtime
// role: normalizer
// source_truth: implementation
function formatHumanInterjection(text) {
  if (typeof text !== "string" || text.trim() === "") {
    return "(no human instruction for this round)";
  }
  return text.trim();
}

module.exports = { buildRoundContext, formatHumanInterjection };
