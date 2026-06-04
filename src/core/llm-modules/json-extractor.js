// warehouse:file
// responsibility: Extracts valid JSON from model output, attempting multiple parsing strategies (direct, code fence, brace extraction)
// actor: core_runtime
// role: parser
// source_truth: implementation

// warehouse:method
// responsibility: Extracts valid JSON from model output, attempting multiple parsing strategies (direct, code fence, brace extraction)
// actor: core_runtime
// role: parser
// source_truth: implementation
function extractJSON(text) {
  if (typeof text !== "string") {
    throw new Error("Model output is not text");
  }

  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch (_err) {
    // Next attempt
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch (_err) {
      // Next attempt
    }
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start !== -1 && end !== -1) {
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch (_err) {
      // No valid JSON found
    }
  }

  throw new Error("Could not extract JSON from model output");
}

module.exports = { extractJSON };
