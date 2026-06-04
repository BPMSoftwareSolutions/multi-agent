// warehouse:file
// responsibility: Partitions work items into packets with budget constraints using chunking strategy
// actor: worker_bee_infrastructure
// role: packer
// source_truth: implementation

const { anchorCost, fileChars, packWork } = require("./partition-logic");

// warehouse:method
// responsibility: Partitions work items into packets: chunks array into fixed-size groups for packing
// actor: method_implementation
// role: implementation
// source_truth: implementation
function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

module.exports = { chunk, anchorCost, fileChars, packWork };
