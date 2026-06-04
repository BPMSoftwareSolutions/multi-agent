// warehouse:file
// responsibility: Extracts JSON from model output, handling bare JSON, markdown fence blocks, and substring ranges
// actor: worker_bee_infrastructure
// role: parser
// source_truth: implementation

// warehouse:method
// responsibility: Extracts JSON from model output, handling bare JSON, markdown fence blocks, and substring ranges
// actor: worker_bee_infrastructure
// role: parser
// source_truth: implementation
function extractJSON(text) {
  if (typeof text !== "string") throw new Error("Model output is not text");
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch (_e) {
    /* fall through */
  }
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch (_e) {
      /* fall through */
    }
  }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end !== -1) {
    return JSON.parse(trimmed.slice(start, end + 1));
  }
  throw new Error("Could not extract JSON from model output");
}

module.exports = { extractJSON };
