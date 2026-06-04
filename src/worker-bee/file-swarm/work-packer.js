// warehouse:file
// responsibility: Provides chunk, anchorCost, fileChars functionality
// actor: worker_bee_infrastructure
// role: packer
// source_truth: implementation

const fs = require("fs");

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

// warehouse:method
// responsibility: Partitions work items into packets: calculates anchor budget cost for packing
// actor: method_implementation
// role: implementation
// source_truth: implementation
function anchorCost(item) {
  return (item.doFile ? 1 : 0) + (item.doMethods ? item.methodsNeeding.length : 0);
}

// warehouse:method
// responsibility: Partitions work items into packets: calculates file character size for packing budget
// actor: method_implementation
// role: implementation
// source_truth: implementation
function fileChars(item) {
  try {
    return fs.statSync(item.absPath).size;
  } catch (_e) {
    return 0;
  }
}

// warehouse:method
// responsibility: Partitions work items into packets: greedily packs within anchor, file, and char budgets
// actor: method_implementation
// role: implementation
// source_truth: implementation
function packWork(work, workload) {
  const fileCap = workload.max_files_per_packet;
  const anchorBudget = workload.anchor_budget;
  const charBudget = workload.input_char_budget;
  const packets = [];
  let cur = null;
  const flush = () => {
    if (cur && cur.items.length) packets.push(cur);
    cur = null;
  };
  for (const item of work) {
    const cost = anchorCost(item);
    if (cost > anchorBudget) {
      flush();
      packets.push({ items: [item], oversize: true });
      continue;
    }
    const chars = fileChars(item);
    if (!cur) cur = { items: [], cost: 0, chars: 0, oversize: false };
    if (cur.items.length >= fileCap || cur.cost + cost > anchorBudget || cur.chars + chars > charBudget) {
      flush();
      cur = { items: [], cost: 0, chars: 0, oversize: false };
    }
    cur.items.push(item);
    cur.cost += cost;
    cur.chars += chars;
  }
  flush();
  return packets;
}

module.exports = { chunk, anchorCost, fileChars, packWork };
