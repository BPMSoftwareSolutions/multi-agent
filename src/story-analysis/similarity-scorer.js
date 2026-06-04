// warehouse:file
// responsibility: Computes semantic alignment scores from concept vocabularies
// actor: similarity_engine
// role: comparator
// source_truth: implementation

const { extractConcepts } = require("./concepts-extractor");

// warehouse:method
// responsibility: Computes semantic alignment score by extracting concepts and calculating word overlap ratio
// actor: similarity_engine
// role: comparator
// source_truth: implementation
function computeSimilarity(fileResp, methodResp) {
  const fileConcepts = extractConcepts(fileResp);
  const methodConcepts = extractConcepts(methodResp);

  const overlap = fileConcepts.words.filter((w) => methodConcepts.words.includes(w)).length;
  const maxLength = Math.max(fileConcepts.words.length, methodConcepts.words.length);

  return maxLength > 0 ? (overlap / maxLength) * 100 : 0;
}

module.exports = { computeSimilarity };
