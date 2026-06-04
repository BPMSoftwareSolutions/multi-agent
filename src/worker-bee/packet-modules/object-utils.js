// warehouse:file
// responsibility: Type-checks whether a value is a plain object (excludes arrays and nulls)
// actor: worker_bee_infrastructure
// role: infrastructure
// source_truth: implementation

// warehouse:method
// responsibility: Type-checks whether a value is a plain object (excludes arrays and nulls)
// actor: worker_bee_infrastructure
// role: infrastructure
// source_truth: implementation
function isObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

// warehouse:method
// responsibility: Removes undefined/null values from object to prevent blanking defaults during merge
// actor: worker_bee_infrastructure
// role: infrastructure
// source_truth: implementation
function prune(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    out[k] = v;
  }
  return out;
}

module.exports = {
  isObject,
  prune
};
