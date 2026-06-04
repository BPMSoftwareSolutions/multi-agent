// warehouse:file
// responsibility: Merges packet configurations with shallow-deep strategy for nested objects
// actor: worker_bee_infrastructure
// role: infrastructure
// source_truth: implementation

const { isObject, prune } = require("./object-utils");

// warehouse:method
// responsibility: Builds packet configurations: merges base and override with shallow-deep strategy for swarm and workload
// actor: worker_bee_infrastructure
// role: infrastructure
// source_truth: implementation
function mergePacket(base, override) {
  if (!isObject(override)) return base;
  const out = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined || value === null) continue;
    if (isObject(value) && isObject(base[key])) out[key] = { ...base[key], ...prune(value) };
    else out[key] = value;
  }
  return out;
}

module.exports = { mergePacket };
