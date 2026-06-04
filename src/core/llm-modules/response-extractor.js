// warehouse:file
// responsibility: undefined — extractTextFromResponse
// actor: method_implementation
// role: implementation
// source_truth: implementation

// warehouse:method
// responsibility: undefined — extractTextFromResponse
// actor: method_implementation
// role: implementation
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
