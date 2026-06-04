// warehouse:file
// responsibility: Constructs planner prompt from stage goals, task intent, artifact, and feedback and Constructs reviewer prompt to evaluate proposed artifact changes
// actor: core_runtime
// role: agent_guidance
// source_truth: implementation

const { schemaToText, toJSONString } = require("./schema-formatter");

// warehouse:method
// responsibility: Constructs planner prompt from stage goals, task intent, artifact, and feedback and Constructs reviewer prompt to evaluate proposed artifact changes
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildBuilderPrompt({ stage, intent, artifact, lastRound, humanInterjection, brief, roundNumber }) {
  const isStageOneFirstRound =
    stage.id === "idea" && roundNumber === 1 && Object.keys(artifact || {}).every((key) => {
      const value = artifact[key];
      if (Array.isArray(value)) return value.length === 0;
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

  const context = lastRound ? `Previous round feedback: ${lastRound.reviewer.feedback}\nHuman interjection: ${humanInterjection}` : "";

  return {
    system,
    messages: [
      {
        role: "user",
        content: [taskLine, context, "Return JSON only."].filter(Boolean).join("\n\n")
      }
    ]
  };
}

// warehouse:method
// responsibility: Constructs planner prompt from stage goals, task intent, artifact, and feedback and Constructs reviewer prompt to evaluate proposed artifact changes
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildReviewerPrompt({ intent, accepted, proposed }) {
  return {
    system: [
      "You are the Reviewer AI. Your role is to evaluate proposed changes against the task intent.",
      "Identify issues (missing fields, contradictions, scope drift) and rate complexity (low/medium/high).",
      "Return JSON only."
    ].join("\n"),
    messages: [
      {
        role: "user",
        content: [
          `Task intent: ${intent.task_definition}`,
          "",
          "Accepted artifact (current version):",
          toJSONString(accepted),
          "",
          "Proposed artifact (changes):",
          toJSONString(proposed),
          "",
          'Return JSON with: {"feedback": "", "has_issues": boolean, "complexity": "low|medium|high"}'
        ].join("\n")
      }
    ]
  };
}

module.exports = { buildBuilderPrompt, buildReviewerPrompt };
