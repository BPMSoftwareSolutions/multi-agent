// warehouse:file
// responsibility: Removes leading UTF-8 BOM from text to ensure clean parsing
// actor: method_implementation
// role: implementation
// source_truth: implementation

// warehouse:method
// responsibility: Removes leading UTF-8 BOM from text to ensure clean parsing
// actor: method_implementation
// role: implementation
// source_truth: implementation
function stripBom(text) {
  return text && text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

module.exports = { stripBom };
