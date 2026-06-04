// warehouse:file
// responsibility: Delegates ledger operations (run init, packet writing, status combining) to focused modules
// actor: worker_bee_infrastructure
// role: data_access
// source_truth: implementation

// Live status ledger WITHOUT shared-file write contention.
//
// Design: each completed packet writes its OWN immutable part file
//   reports/runs/<run_id>/packet-p<pass>-<index>.json
// The run manifest is written once at start. The orchestrator/monitor COMBINES
// the manifest + all part files on read to produce the live status. No two writers
// ever touch the same file, so bees (even as separate processes later) never
// contend on I/O. The single status-latest.json is only written once, at the end,
// by the orchestrator as the combined artifact.

const { newRunId, initRun } = require("./ledger/run-init");
const { writePart } = require("./ledger/packet-writer");
const { combineRun, finalizeRun, readLatestStatus } = require("./ledger/run-combiner");

module.exports = { newRunId, initRun, writePart, combineRun, finalizeRun, readLatestStatus };
