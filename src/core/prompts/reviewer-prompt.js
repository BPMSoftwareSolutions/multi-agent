// warehouse:file
// responsibility: Constructs reviewer agent prompt for artifact evaluation
// actor: core_runtime
// role: agent_guidance
// source_truth: implementation

const { toJSONString } = require("./schema-formatter");

// warehouse:method
// responsibility: Constructs reviewer agent prompt to evaluate proposed artifact changes against task intent, identifying alignment issues and complexity assessment
// actor: core_runtime
// role: agent_guidance
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

module.exports = { buildReviewerPrompt };
