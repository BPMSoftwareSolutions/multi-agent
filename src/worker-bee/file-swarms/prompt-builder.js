// warehouse:file
// responsibility: Constructs multi-file prompt for language model anchor classification of concurrent agents
// actor: worker_bee_infrastructure
// role: prompt_builder
// source_truth: implementation

const { readTruncated } = require("./file-reader");

// warehouse:method
// responsibility: Constructs multi-file prompt for language model anchor classification of concurrent agents
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildUserPrompt(packet) {
  const blocks = packet.map((f) => {
    return `=== FILE: ${f.path} ===\n${readTruncated(f.absPath)}`;
  });
  return (
    `Classify the following ${packet.length} Python file(s). ` +
    `Return one entry per file, echoing each path exactly.\n\n` +
    blocks.join("\n\n")
  );
}

module.exports = { buildUserPrompt };
