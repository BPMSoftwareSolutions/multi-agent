// warehouse:file
// responsibility: undefined — renderStatus
// actor: method_implementation
// role: implementation
// source_truth: implementation

// warehouse:method
// responsibility: undefined — renderStatus
// actor: method_implementation
// role: implementation
// source_truth: implementation
function renderStatus(status, json) {
  if (!status) {
    console.log("No status ledger yet (reports/status-latest.json not found). Start a run first.");
    return;
  }
  if (json) {
    console.log(JSON.stringify(status, null, 2));
    return;
  }
  const t = status.totals;
  const pct = t.needs_work ? Math.round((t.done / t.needs_work) * 100) : 100;
  console.log(`Worker-bee status [${status.state}]  run ${status.run_id}`);
  console.log(`  target: ${status.target}   layer: ${status.layer}   ${status.packet.agents} bees x ${status.packet.files_per_packet}/packet`);
  console.log(`  started: ${status.started_at}   updated: ${status.updated_at}`);
  console.log(`  progress: ${t.done}/${t.needs_work} done (${pct}%)  remaining: ${t.remaining}  errors: ${t.outstanding_errors}  methods: ${t.methods_written}`);
  console.log(`  packets completed: ${status.packets.completed}   pass: ${status.pass}`);
  if (status.errors && status.errors.length) {
    console.log("  outstanding errors:");
    for (const e of status.errors.slice(0, 8)) console.log(`    - ${e.path}: ${e.reason}`);
  }
}

module.exports = { renderStatus };
