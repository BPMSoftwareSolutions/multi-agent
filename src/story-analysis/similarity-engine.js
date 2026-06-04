// warehouse:file
// responsibility: Exports similarity scoring and boilerplate classification functions for anchor alignment analysis
// actor: similarity_engine
// role: classifier
// source_truth: implementation

const { computeSimilarity } = require("./similarity-scorer");
const { isBoilerplate, getAlignmentThreshold, detectRedFlags } = require("./boilerplate-classifier");

module.exports = {
  computeSimilarity,
  isBoilerplate,
  getAlignmentThreshold,
  detectRedFlags,
};
