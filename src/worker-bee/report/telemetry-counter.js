// warehouse:file
// responsibility: Increments telemetry counter in map for given key, tracking cumulative evidence metrics during file scanning
// actor: worker_bee_infrastructure
// role: infrastructure
// source_truth: implementation

// warehouse:method
// responsibility: undefined
// actor: undefined
// role: undefined
// source_truth: implementation

function increment(map, key) {
  map[key] = (map[key] || 0) + 1;
}

module.exports = { increment };
