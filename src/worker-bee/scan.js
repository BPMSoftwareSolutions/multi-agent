// warehouse:file
// responsibility: CLI aggregator for Python anchor scanning - delegates to focused scanner modules
// actor: worker_bee_infrastructure
// role: entry_point
// source_truth: implementation

const { SKIP_DIRS, listPythonFiles } = require("./anchor-scanner/file-discoverer");
const { findMissing, findWork, analyzeFile } = require("./anchor-scanner/audit-engine");
const { serializeWork } = require("./anchor-scanner/work-serializer");
const { assessAnchor } = require("./anchor-scanner/anchor-auditor");
const { parseFileAnchor, parseFileAnchorLines } = require("./anchor-scanner/anchor-parser");
const { buildAnchorBlock, insertAnchor, replaceAnchor } = require("./anchor-scanner/anchor-builder");
const { stripBom, dominantEol, splitKeepEnds, repoRelative, computeRepoRootDepth, isPlaceholder, isGenericResponsibility } = require("./text-utils");

module.exports = {
  SKIP_DIRS,
  listPythonFiles,
  findMissing,
  findWork,
  serializeWork,
  analyzeFile,
  parseFileAnchor,
  parseFileAnchorLines,
  assessAnchor,
  buildAnchorBlock,
  insertAnchor,
  replaceAnchor,
  stripBom,
  dominantEol,
  splitKeepEnds,
  repoRelative,
  computeRepoRootDepth,
  isPlaceholder,
  isGenericResponsibility,
};
