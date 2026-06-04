// warehouse:file
// responsibility: Tracks telemetry evidence with cumulative counter metrics
// actor: worker_bee_infrastructure
// role: infrastructure
// source_truth: implementation

// warehouse:method
// responsibility: Increments telemetry counter in map for given key, tracking cumulative evidence metrics during file scanning
// actor: worker_bee_infrastructure
// role: infrastructure
// source_truth: implementation
function increment(map, key) {
  map[key] = (map[key] || 0) + 1;
}

module.exports = { increment };
