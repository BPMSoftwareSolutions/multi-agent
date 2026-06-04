// warehouse:file
// responsibility: Delegates similarity and boilerplate classification to focused modules
// actor: similarity_engine
// role: orchestrator
// source_truth: implementation

const { computeSimilarity } = require("./similarity-scorer");
const { isBoilerplate, getAlignmentThreshold, detectRedFlags } = require("./boilerplate-classifier");

module.exports = {
  computeSimilarity,
  isBoilerplate,
  getAlignmentThreshold,
  detectRedFlags,
};
