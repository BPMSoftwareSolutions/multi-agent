// warehouse:file
// responsibility: Exports report building functions
// actor: worker_bee_infrastructure
// role: telemetry_evidence
// source_truth: implementation

const { buildReport } = require("./report-assembler");
const { formatReport } = require("./report-formatter");

module.exports = { buildReport, formatReport };
