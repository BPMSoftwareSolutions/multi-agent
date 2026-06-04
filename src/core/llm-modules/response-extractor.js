// warehouse:file
// responsibility: Extracts text content from model API response objects
// actor: core_runtime
// role: response_extractor
// source_truth: implementation

// warehouse:method
// responsibility: Extracts text content from model response, filtering text blocks and joining with newlines
// actor: core_runtime
// role: response_extractor
// source_truth: implementation
function extractTextFromResponse(response) {
  const text = (response.content || [])
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("\n")
    .trim();

  return text;
}

module.exports = { extractTextFromResponse };
