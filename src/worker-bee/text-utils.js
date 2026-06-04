// warehouse:file
// responsibility: Re-exports text processing utilities from focused modules (encoding, paths, line endings, validation)
// actor: worker_bee_infrastructure
// role: aggregator
// source_truth: implementation

const { stripBom } = require("./text-processing/encoding-utils");
const { repoRelative, computeRepoRootDepth, normPath } = require("./text-processing/path-utils");
const { dominantEol, splitKeepEnds } = require("./text-processing/line-ending-utils");
const { isPlaceholder, isGenericResponsibility } = require("./text-processing/validation-utils");

module.exports = {
  stripBom,
  repoRelative,
  computeRepoRootDepth,
  dominantEol,
  splitKeepEnds,
  isPlaceholder,
  isGenericResponsibility,
  normPath,
};
