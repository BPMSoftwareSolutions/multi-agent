// warehouse:file
// responsibility: Formats planner prompt system message with schema and stage goals
// actor: prompt_builder
// role: formatter
// source_truth: implementation

const { schemaToText } = require("./schema-formatter");

// warehouse:method
// responsibility: Composes system message with stage context, artifact schema, and instructions for planner
// actor: method_implementation
// role: implementation
// source_truth: implementation
function formatSystemMessage({ stage, intent, artifact }) {
  return [
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
    JSON.stringify(artifact, null, 2)
  ].join("\n");
}

module.exports = { formatSystemMessage };
