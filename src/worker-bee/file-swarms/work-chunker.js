// warehouse:file
// responsibility: Partitions work items into fixed-size chunks for concurrent processing
// actor: worker_bee_infrastructure
// role: partitioner
// source_truth: implementation

// warehouse:method
// responsibility: Partitions array into fixed-size chunks
// actor: worker_bee_infrastructure
// role: partitioner
// source_truth: implementation
function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

module.exports = { chunk };
