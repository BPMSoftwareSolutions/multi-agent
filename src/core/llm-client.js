// warehouse:file
// responsibility: Delegates to specialized LLM modules for model calls, retries, and JSON extraction
// actor: core_runtime
// role: entry_point
// source_truth: implementation

const { callClaude } = require("./llm-modules/model-caller");
const { callClaudeWithRetry } = require("./llm-modules/retry-caller");
const { extractJSON } = require("./llm-modules/json-extractor");

module.exports = { callClaude, callClaudeWithRetry, extractJSON };
