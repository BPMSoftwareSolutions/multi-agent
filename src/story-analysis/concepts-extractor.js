// warehouse:file
// responsibility: Extracts key concepts and verbs from responsibility text for semantic comparison
// actor: method_implementation
// role: implementation
// source_truth: implementation

// warehouse:method
// responsibility: Extracts key concepts and verbs from responsibility text for semantic comparison
// actor: method_implementation
// role: implementation
// source_truth: implementation
function extractConcepts(text) {
  if (!text) return { words: [], verbs: [], nouns: [] };

  const words = text.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const verbs = words.filter(
    (w) =>
      w.endsWith("s") ||
      w.endsWith("ing") ||
      w.endsWith("ed") ||
      ["manages", "handles", "validates", "generates", "extracts", "parses"].includes(w)
  );
  const nouns = words.filter((w) => !verbs.includes(w));

  return { words, verbs, nouns };
}

module.exports = { extractConcepts };
