// warehouse:file
// responsibility: undefined
// actor: undefined
// role: undefined
// source_truth: implementation

// warehouse:method
// responsibility: undefined
// actor: undefined
// role: undefined
// source_truth: implementation

function serializeWork(work) {
  return work.map((w) => ({
    absPath: w.absPath,
    path: w.path,
    deterministic: w.deterministic,
    doFile: w.doFile,
    doMethods: w.doMethods,
    fileExisting: w.fileExisting,
    fileIssues: w.fileIssues,
    methodsNeeding: w.methodsNeeding.map((d) => ({
      id: d.id,
      name: d.name,
      indent: d.indent,
      lineIdx: d.lineIdx,
      existing: d.existing,
      reason: d.reason,
      issues: d.issues,
    })),
  }));
}

module.exports = { serializeWork };
