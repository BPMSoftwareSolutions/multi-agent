// warehouse:file
// responsibility: Computes semantic alignment score between file and method responsibilities
// actor: coherence_analyzer
// role: similarity_scorer
// source_truth: implementation

const { extractConcepts } = require("./concepts-extractor");

// warehouse:method
// responsibility: Computes semantic alignment score by extracting concept vocabularies and calculating word overlap ratio
// actor: method_implementation
// role: implementation
// source_truth: implementation
function computeSimilarity(fileResp, methodResp) {
  const fileConcepts = extractConcepts(fileResp);
  const methodConcepts = extractConcepts(methodResp);

  const overlap = fileConcepts.words.filter((w) => methodConcepts.words.includes(w)).length;
  const maxLength = Math.max(fileConcepts.words.length, methodConcepts.words.length);

  return maxLength > 0 ? (overlap / maxLength) * 100 : 0;
}

module.exports = { computeSimilarity };
