// warehouse:file
// responsibility: undefined
// actor: undefined
// role: undefined
// source_truth: implementation

// warehouse:method
// responsibility: undefined
// actor: undefined
// role: undefined
// source_truth: implementation

function formatTimeDiff(ms) {
  if (ms < 60000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  return `${Math.floor(ms / 3600000)}h ago`;
}

module.exports = { formatTimeDiff };
