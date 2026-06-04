// warehouse:file
// responsibility: Detects whether text uses CRLF or LF as dominant line-ending style
// actor: method_implementation
// role: implementation
// source_truth: implementation

// warehouse:method
// responsibility: Detects whether text uses CRLF or LF as dominant line-ending style
// actor: method_implementation
// role: implementation
// source_truth: implementation
function dominantEol(text) {
  const crlfCount = (text.match(/\r\n/g) || []).length;
  const lfCount = (text.match(/\n/g) || []).length - crlfCount;
  return crlfCount > lfCount ? "\r\n" : "\n";
}

// warehouse:method
// responsibility: Splits text into segments while preserving individual line endings for each line
// actor: method_implementation
// role: implementation
// source_truth: implementation
function splitKeepEnds(text) {
  const lines = [];
  let i = 0;
  let start = 0;

  while (i < text.length) {
    if (text[i] === "\n") {
      lines.push(text.substring(start, i + 1));
      start = i + 1;
    } else if (text[i] === "\r" && text[i + 1] === "\n") {
      lines.push(text.substring(start, i + 2));
      start = i + 2;
      i += 1;
    }
    i += 1;
  }

  if (start < text.length) {
    lines.push(text.substring(start));
  }

  return lines;
}

module.exports = {
  dominantEol,
  splitKeepEnds,
};
