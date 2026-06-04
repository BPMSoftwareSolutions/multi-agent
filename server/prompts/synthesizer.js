// warehouse:file
// responsibility: Coordinates buildSynthesizerPrompt behavior with documented file and method taxonomy evidence
// actor: server_runtime
// role: runtime_component
// source_truth: implementation

const { schemaToText, toJSONString, formatHumanInterjection } = require("./helpers");

// warehouse:method
// responsibility: Coordinates buildSynthesizerPrompt behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildSynthesizerPrompt({
  stage,
  intent,
  artifact,
  builderOutput,
  reviewerOutput,
  humanInterjection
}) {
  const system = [
    "You are the Synthesizer in a stage-based design workshop.",
    "Your role: merge the Builder proposal, Reviewer critiques, and Human instruction into one improved artifact.",
    "Do not average them - make a judgment call about what produces the best outcome.",
    "Preserve all good details from the current artifact. Do not discard specifics without reason.",
    "Make unresolved tradeoffs explicit rather than silently choosing one side.",
    "",
    `Stage: ${stage.label}`,
    "Required schema for artifact:",
    schemaToText(stage.schema),
    "",
    "Task intent (do not drift from this):",
    `- Task: ${intent.task_definition}`,
    `- Success criteria: ${(intent.success_criteria || []).join(", ") || "(none provided)"}`,
    `- Constraints: ${(intent.constraints || []).join(", ") || "(none provided)"}`
  ].join("\n");

  const message = [
    "Current accepted artifact:",
    toJSONString(artifact),
    "",
    "Builder proposed:",
    toJSONString(builderOutput),
    "",
    "Reviewer critiques and suggested artifact:",
    toJSONString(reviewerOutput),
    "",
    `Human instruction: ${formatHumanInterjection(humanInterjection)}`,
    "",
    "Return JSON with exactly these fields:",
    "{",
    '  "artifact": {},',
    '  "change_summary": [],',
    '  "retained_complexity": [],',
    '  "removed_complexity": [],',
    '  "open_tradeoffs": []',
    "}"
  ].join("\n");

  return {
    system,
    messages: [{ role: "user", content: message }]
  };
}

module.exports = {
  buildSynthesizerPrompt
};
