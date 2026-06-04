// warehouse:file
// responsibility: Constructs language model prompts from work items and method metadata
// actor: worker_bee_infrastructure
// role: builder
// source_truth: implementation

const { readForPrompt } = require("./file-reader");

// warehouse:method
// responsibility: Formatter: formats method list for language model prompts with IDs, names, line numbers from metadata
// actor: worker_bee_infrastructure
// role: formatter
// source_truth: implementation
function methodList(item) {
  if (!item.doMethods || !item.methodsNeeding.length) return "METHODS TO ANCHOR: none — return an empty methods array.";
  return "METHODS TO ANCHOR (ids):\n" + item.methodsNeeding.map((d) => `${d.id}: ${d.name} (line ${d.lineIdx + 1})`).join("\n");
}

// warehouse:method
// responsibility: Builder: constructs language model prompts from work items combining file content and method metadata
// actor: worker_bee_infrastructure
// role: builder
// source_truth: implementation
function buildPacketPrompt(packet, workload) {
  const blocks = packet.items.map((item) =>
    [`=== FILE: ${item.path} ===`, readForPrompt(item.absPath, workload.file_char_budget), methodList(item)].join("\n")
  );
  return `Classify the following ${packet.items.length} file(s). Return one "files" entry per file, echoing each path exactly.\n\n${blocks.join("\n\n")}`;
}

module.exports = { methodList, buildPacketPrompt };
