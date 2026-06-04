// warehouse:file
// responsibility: undefined
// actor: undefined
// role: undefined
// source_truth: implementation

// warehouse:method
// responsibility: undefined
// actor: method_implementation
// role: implementation
// source_truth: implementation
function increment(map, key) {
  map[key] = (map[key] || 0) + 1;
}

module.exports = { increment };
