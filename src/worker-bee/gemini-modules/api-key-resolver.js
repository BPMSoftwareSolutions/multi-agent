// warehouse:file
// responsibility: Resolves Gemini API key from environment or override parameter
// actor: worker_bee_infrastructure
// role: credential_manager
// source_truth: implementation

// warehouse:method
// responsibility: Resolves Gemini API key from override or environment variables
// actor: worker_bee_infrastructure
// role: credential_manager
// source_truth: implementation
function getApiKey(override) {
  const key =
    override ||
    process.env.LOC_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY;
  if (!key) {
    throw new Error("LOC_GEMINI_API_KEY (or GEMINI_API_KEY / GOOGLE_API_KEY) is not set");
  }
  return key;
}

module.exports = { getApiKey };
