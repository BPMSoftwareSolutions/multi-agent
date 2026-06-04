// warehouse:file
// responsibility: Delegates language model calling to focused modules for direct calls and retry orchestration
// actor: worker_bee_infrastructure
// role: facade
// source_truth: implementation

const { callGemini, DEFAULT_MODEL } = require("./gemini-caller");
const { callGeminiJSON } = require("./json-caller-with-retry");

module.exports = { callGemini, callGeminiJSON, DEFAULT_MODEL };
