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

module.exports = {
  buildIntentPrompt
};
