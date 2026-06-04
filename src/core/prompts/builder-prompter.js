// warehouse:file
// responsibility: Combines stage config, intent, artifact, round context, and human interjection into planner prompt
// actor: core_runtime
// role: prompt_builder
// source_truth: implementation

const { schemaToText, toJSONString } = require("./schema-formatter");
const { buildRoundContext, formatHumanInterjection } = require("./context-builder");

// warehouse:method
// responsibility: Combines stage config, intent, artifact, round context, and human interjection into planner prompt
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildBuilderPrompt({
  stage,
  intent,
  artifact,
  lastRound,
  humanInterjection,
  brief,
  roundNumber
}) {
  const isStageOneFirstRound =
    stage.id === "idea" && roundNumber === 1 && Object.keys(artifact || {}).every((key) => {
      const value = artifact[key];
      if (Array.isArray(value)) {
        return value.length === 0;
      }
      return value === "";
    });

  const system = [
    "You are the Planner AI in a stage-based design workshop.",
    "Your role: propose the most concrete, compelling version of the current artifact.",
    "Be specific. Make decisions. Avoid hedge phrases.",
    "Return your response as a JSON object matching the schema below.",
    "Do not include explanation outside the JSON.",
    "",
    `Stage: ${stage.label}`,
    `Stage goal: ${stage.builderFocus}`,
    "",
    "Task intent (do not drift from this):",
    `- Task: ${intent.task_definition}`,
    `- Success criteria: ${(intent.success_criteria || []).join(", ") || "(none provided)"}`,
    `- Constraints: ${(intent.constraints || []).join(", ") || "(none provided)"}`,
    "",
    "Required schema:",
    schemaToText(stage.schema),
    "",
    "Current artifact (your starting point - improve it):",
    toJSONString(artifact)
  ].join("\n");

  const taskLine = isStageOneFirstRound
    ? `User brief: ${brief}. Create the initial idea artifact.`
    : "Continue developing the artifact. Make it more concrete and specific.";

  const message = [
    `Human instruction: ${formatHumanInterjection(humanInterjection)}`,
    taskLine,
    "",
    "Last round context:",
    buildRoundContext(lastRound),
    "",
    "Return only the updated artifact JSON. No explanation."
  ].join("\n");

  return {
    system,
    messages: [{ role: "user", content: message }]
  };
}

module.exports = { buildBuilderPrompt };
