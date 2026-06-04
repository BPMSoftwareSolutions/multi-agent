// warehouse:file
// responsibility: Builds prompt for reviewer to assess artifact alignment with task goals
// actor: core_runtime
// role: prompt_builder
// source_truth: implementation

const { toJSONString } = require("./schema-formatter");

// warehouse:method
// responsibility: Builds prompt for reviewer to assess artifact alignment with task goals
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

module.exports = { buildReviewerPrompt };
