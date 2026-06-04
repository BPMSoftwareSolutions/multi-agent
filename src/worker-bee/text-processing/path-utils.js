// warehouse:file
// responsibility: Delegates path operations to focused modules
// actor: worker_bee_infrastructure
// role: orchestrator
// source_truth: implementation

const { repoRelative, normPath } = require("./path-normalizer");
const { computeRepoRootDepth } = require("./depth-calculator");

module.exports = {
  repoRelative,
  computeRepoRootDepth,
  normPath,
};
