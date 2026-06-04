// warehouse:file
// responsibility: Locates function definitions in source code and assigns sequential IDs
// actor: worker_bee_infrastructure
// role: projection_compiler
// source_truth: implementation

const DEF_RE = /^(\s*)(?:async\s+)?def\s+([A-Za-z_]\w*)/;

// warehouse:method
// responsibility: Locates all function/method definitions in source lines and assigns sequential IDs
// actor: method_implementation
// role: implementation
// source_truth: implementation
function findDefs(lines) {
  const defs = [];
  let id = 0;
  for (let i = 0; i < lines.length; i += 1) {
    const m = lines[i].match(DEF_RE);
    if (m) {
      defs.push({ id: id++, name: m[2], indent: m[1], lineIdx: i });
    }
  }
  return defs;
}

module.exports = { findDefs };
