function schemaToText(schema) {
  const lines = ["Fields required in your JSON response:"];

  for (const [field, meta] of Object.entries(schema || {})) {
    lines.push(`- ${field} (${meta.type}): ${meta.description}`);
  }

  return lines.join("\n");
}

function toJSONString(value) {
  return JSON.stringify(value, null, 2);
}

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
