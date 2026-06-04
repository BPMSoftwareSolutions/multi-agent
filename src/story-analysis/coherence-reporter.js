// warehouse:file
// responsibility: Exports report formatter and writer modules for coherence analysis output
// actor: module_aggregator
// role: aggregator
// source_truth: implementation

module.exports = {
  ...require("./report-formatter"),
  ...require("./report-writer"),
};
