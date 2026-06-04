// warehouse:file
// responsibility: Retrieves and validates API key for language model providers from environment or override
// actor: core_runtime
// role: credential_manager
// source_truth: implementation

// warehouse:method
// responsibility: Retrieves and validates API key for language model providers from environment or override
// actor: method_implementation
// role: implementation
// source_truth: implementation
function getApiKey(overrideApiKey) {
  const apiKey = overrideApiKey || process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY or CLAUDE_API_KEY is not set");
  }
  return apiKey;
}

module.exports = { getApiKey };
