// warehouse:file
// responsibility: Formats previous round context for agent prompts with interjection handling
// actor: core_runtime
// role: prompt_builder
// source_truth: implementation

const { toJSONString } = require("./schema-formatter");

// warehouse:method
// responsibility: Determines initial vs continuation task line based on stage and round context
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildTaskLine({ stage, brief, roundNumber, isStageOneFirstRound }) {
  return isStageOneFirstRound
    ? `User brief: ${brief}. Create the initial idea artifact.`
    : "Continue developing the artifact. Make it more concrete and specific.";
}

// warehouse:method
// responsibility: Combines previous round feedback and human interjection into context block
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildContextLines({ lastRound, humanInterjection }) {
  if (!lastRound) return "";
  return `Previous round feedback: ${lastRound.reviewer.feedback}\nHuman interjection: ${humanInterjection}`;
}

// warehouse:method
// responsibility: Assembles task line and context into complete user message content
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildUserMessage({ taskLine, context }) {
  return [taskLine, context, "Return JSON only."].filter(Boolean).join("\n\n");
}

// warehouse:method
// responsibility: Formats round context including interjection, change summary, artifact state
// actor: method_implementation
// role: implementation
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
// responsibility: Normalizes and formats human interjection text for prompt injection
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatHumanInterjection(text) {
  if (typeof text !== "string" || text.trim() === "") {
    return "(no human instruction for this round)";
  }
  return text.trim();
}

module.exports = { buildTaskLine, buildContextLines, buildUserMessage, buildRoundContext, formatHumanInterjection };
