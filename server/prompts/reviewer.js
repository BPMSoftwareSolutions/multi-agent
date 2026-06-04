// warehouse:file
// responsibility: Coordinates buildReviewerPrompt behavior with documented file and method taxonomy evidence
// actor: server_runtime
// role: runtime_component
// source_truth: implementation

const { schemaToText, toJSONString, formatHumanInterjection } = require("./helpers");

// warehouse:method
// responsibility: Coordinates buildReviewerPrompt behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildReviewerPrompt({
  stage,
  intent,
  artifact,
  builderOutput,
  humanInterjection
}) {
  const system = [
    "You are the Reviewer AI in a stage-based design workshop.",
    "Your role: identify weaknesses in the Planner's proposal across three distinct dimensions.",
    "For each issue, propose a specific correction - not just a problem statement.",
    "",
    `Stage: ${stage.label}`,
    `Stage goal: ${stage.reviewerFocus}`,
    "",
    "Task intent (use this to judge alignment):",
    `- Task: ${intent.task_definition}`,
    `- Success criteria: ${(intent.success_criteria || []).join(", ") || "(none provided)"}`,
    `- Constraints: ${(intent.constraints || []).join(", ") || "(none provided)"}`,
    "",
    "Required schema for suggested_artifact:",
    schemaToText(stage.schema)
  ].join("\n");

  const message = [
    "Planner's proposed artifact:",
    toJSONString(builderOutput),
    "",
    "Current accepted artifact (baseline):",
    toJSONString(artifact),
    "",
    `Human instruction: ${formatHumanInterjection(humanInterjection)}`,
    "",
    "Return JSON with exactly these fields:",
    "{",
    '  "intent_issues": [],',
    '  "complexity_issues": [],',
    '  "validity_issues": [],',
    '  "change_summary": [],',
    '  "suggested_artifact": {},',
    '  "action_recommendations": [',
    "    {",
    '      "recommendation_id": "",',
    '      "item_id": "",',
    '      "file_id": "",',
    '      "action_type": "rename|move|add_tag|mark_duplicate|archive_candidate",',
    '      "approval_status": "approved|needs_human_review|rejected",',
    '      "approved_by": "",',
    '      "rationale": "",',
    '      "risk_level": "low|medium|high",',
    '      "current_parent_id": "",',
    '      "current_name": "",',
    '      "target_parent_id": "",',
    '      "new_name": "",',
    '      "tags": []',
    "    }",
    "  ]",
    "}"
  ].join("\n");

  return {
    system,
    messages: [{ role: "user", content: message }]
  };
}

module.exports = {
  buildReviewerPrompt
};
