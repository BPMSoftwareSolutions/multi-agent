// warehouse:file
// responsibility: Orchestrates semantic similarity computation and vocabulary alignment analysis
// actor: coherence_analyzer
// role: engine
// source_truth: implementation

const { computeSimilarity } = require("./similarity-scorer");
const { isBoilerplate, getAlignmentThreshold, detectRedFlags } = require("./boilerplate-classifier");

module.exports = {
  computeSimilarity,
  isBoilerplate,
  getAlignmentThreshold,
  detectRedFlags,
};
