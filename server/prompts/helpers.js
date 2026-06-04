// warehouse:file
// responsibility: Coordinates schemaToText and toJSONString and buildRoundContext and formatHumanInterjection behavior with documented file and method taxonomy evidence
// actor: server_runtime
// role: runtime_component
// source_truth: implementation

// warehouse:method
// responsibility: Coordinates schemaToText and toJSONString and buildRoundContext and formatHumanInterjection behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function schemaToText(schema) {
  const lines = ["Fields required in your JSON response:"];

  for (const [field, meta] of Object.entries(schema || {})) {
    lines.push(`- ${field} (${meta.type}): ${meta.description}`);
  }

  return lines.join("\n");
}

// warehouse:method
// responsibility: Coordinates schemaToText and toJSONString and buildRoundContext and formatHumanInterjection behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function toJSONString(value) {
  return JSON.stringify(value, null, 2);
}

// warehouse:method
// responsibility: Coordinates schemaToText and toJSONString and buildRoundContext and formatHumanInterjection behavior with documented file and method taxonomy evidence
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
// responsibility: Coordinates schemaToText and toJSONString and buildRoundContext and formatHumanInterjection behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatHumanInterjection(text) {
  if (typeof text !== "string" || text.trim() === "") {
    return "(no human instruction for this round)";
  }
  return text.trim();
}

module.exports = {
  schemaToText,
  toJSONString,
  buildRoundContext,
  formatHumanInterjection
};
