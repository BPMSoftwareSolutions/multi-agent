// warehouse:file
// responsibility: Gemini API client aggregator - delegates to focused modules for key resolution, HTTP transport, JSON extraction, retry logic, and orchestration
// actor: worker_bee_infrastructure
// role: entry_point
// source_truth: implementation

const { callGemini, callGeminiJSON, DEFAULT_MODEL } = require("./gemini-modules/gemini-caller");
const { extractJSON } = require("./gemini-modules/json-extractor");
const { getApiKey } = require("./gemini-modules/api-key-resolver");
const { postJson } = require("./gemini-modules/http-client");
const { isRetryable } = require("./gemini-modules/retry-logic");

module.exports = { callGemini, callGeminiJSON, extractJSON, getApiKey, postJson, isRetryable, DEFAULT_MODEL };
