// warehouse:file
// responsibility: Coordinates normalizeIntent behavior with documented file and method taxonomy evidence
// actor: orchestration
// role: intent_extractor
// source_truth: implementation

const { buildIntentPrompt } = require("../prompt-builders");
const { callClaudeWithRetry } = require("../llm-client");

// warehouse:method
// responsibility: Coordinates normalizeIntent behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
async function normalizeIntent(brief, apiKey) {
  const intentPrompt = buildIntentPrompt({ brief });
  try {
    const intent = await callClaudeWithRetry({
      system: intentPrompt.system,
      userMessages: intentPrompt.messages,
      maxTokens: 1024,
      apiKey
    });
    return intent;
  } catch (error) {
    console.error("Failed to normalize intent:", error.message);
    return { task_definition: brief, success_criteria: [], constraints: [], open_questions: [] };
  }
}

module.exports = { normalizeIntent };
