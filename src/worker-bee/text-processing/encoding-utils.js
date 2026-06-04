// warehouse:file
// responsibility: Removes leading UTF-8 BOM from text to ensure clean parsing
// actor: worker_bee_infrastructure
// role: text_normalizer
// source_truth: implementation

// warehouse:method
// responsibility: undefined
// actor: undefined
// role: undefined
// source_truth: implementation

function stripBom(text) {
  return text && text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

module.exports = { stripBom };
