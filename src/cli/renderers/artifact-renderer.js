// warehouse:file
// responsibility: Renders artifact state to human-readable CLI output for display
// actor: cli
// role: renderer
// source_truth: implementation

const { STAGES } = require("../../core/stages");

// warehouse:method
// responsibility: undefined
// actor: undefined
// role: undefined
// source_truth: implementation

function renderArtifact(stageId, artifact) {
  const stage = STAGES[stageId];
  if (!stage) return "";

  const lines = [];
  for (const [field, value] of Object.entries(artifact || {})) {
    if (Array.isArray(value)) {
      if (value.length > 0) {
        lines.push(`${field}:`);
        value.forEach((item) => {
          lines.push(`  - ${item}`);
        });
      }
    } else if (typeof value === "string" && value) {
      lines.push(`${field}: ${value}`);
    } else if (typeof value === "object" && value !== null) {
      lines.push(`${field}: ${JSON.stringify(value, null, 2)}`);
    }
  }

  return lines.join("\n");
}

module.exports = { renderArtifact };
