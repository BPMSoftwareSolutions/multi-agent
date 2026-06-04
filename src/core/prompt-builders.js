// warehouse:file
// responsibility: Builds agent prompts: converts schema to field descriptions, serializes values to JSON, formats previous round context, normalizes interjections, generates specialized prompts for intent/planner/reviewer agents
// actor: core_runtime
// role: prompt_generation
// source_truth: implementation

const { STAGES } = require("./stages");

// Helpers
// warehouse:method
// responsibility: Converts a schema object into human-readable field descriptions for prompt injection
// actor: core_runtime
// role: prompt_formatting
// source_truth: implementation
function schemaToText(schema) {
  const lines = ["Fields required in your JSON response:"];

  for (const [field, meta] of Object.entries(schema || {})) {
    lines.push(`- ${field} (${meta.type}): ${meta.description}`);
  }

  return lines.join("\n");
}

// warehouse:method
// responsibility: Serializes values to formatted JSON strings for prompt embedding
// actor: core_runtime
// role: prompt_formatting
// source_truth: implementation
function toJSONString(value) {
  return JSON.stringify(value, null, 2);
}

// warehouse:method
// responsibility: Formats previous round details including human interjection and artifact changes for context injection
// actor: core_runtime
// role: context_building
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
// responsibility: Normalizes human interjection text, returning placeholder if empty or invalid
// actor: core_runtime
// role: input_normalization
// source_truth: implementation
function formatHumanInterjection(text) {
  if (typeof text !== "string" || text.trim() === "") {
    return "(no human instruction for this round)";
  }
  return text.trim();
}

// Intent Builder
// warehouse:method
// responsibility: Constructs prompt for intent clarification agent to extract task, criteria, constraints, and questions from user brief
// actor: core_runtime
// role: intent_elicitation
// source_truth: implementation
function buildIntentPrompt({ brief }) {
  return {
    system: [
      "You are an intent interpreter. Your role is to clarify a user's brief before any design work begins.",
      "Extract the core task definition, success criteria, constraints, and open questions.",
      "Be concise. Do not invent scope. Surface ambiguity rather than resolve it.",
      "Return only JSON."
    ].join("\n"),
    messages: [
      {
        role: "user",
        content: [
          `User brief: ${brief}`,
          "",
          "Return JSON:",
          "{",
          '  "task_definition": "",',
          '  "success_criteria": [],',
          '  "constraints": [],',
          '  "open_questions": []',
          "}"
        ].join("\n")
      }
    ]
  };
}

// Planner Prompt
// warehouse:method
// responsibility: Constructs prompt for planner agent to propose artifact improvements based on stage goals and human feedback
// actor: core_runtime
// role: planner_guidance
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

// Reviewer Prompt
// warehouse:method
// responsibility: Constructs prompt for reviewer agent to identify intent, complexity, and validity issues with proposed artifact changes
// actor: core_runtime
// role: reviewer_guidance
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
  schemaToText,
  toJSONString,
  buildRoundContext,
  formatHumanInterjection,
  buildIntentPrompt,
  buildBuilderPrompt,
  buildReviewerPrompt
};
