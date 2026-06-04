// warehouse:file
// responsibility: undefined — increment
// actor: method_implementation
// role: implementation
// source_truth: implementation

// warehouse:method
// responsibility: undefined — increment
// actor: method_implementation
// role: implementation
// source_truth: implementation
function increment(map, key) {
  map[key] = (map[key] || 0) + 1;
}

module.exports = { increment };
