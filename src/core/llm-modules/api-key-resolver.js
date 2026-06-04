// warehouse:file
// responsibility: Resolves Anthropic API key from environment or override parameter
// actor: core_runtime
// role: credential_manager
// source_truth: implementation

// warehouse:method
// responsibility: Retrieves and validates the Anthropic API key from environment or override parameter
// actor: core_runtime
// role: credential_manager
// source_truth: implementation
function getApiKey(overrideApiKey) {
  const apiKey = overrideApiKey || process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY or CLAUDE_API_KEY is not set");
  }
  return apiKey;
}

module.exports = { getApiKey };
