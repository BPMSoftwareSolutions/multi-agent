// warehouse:file
// responsibility: Writes packet result files with unique names to prevent write contention
// actor: worker_bee_infrastructure
// role: data_access
// source_truth: implementation

const fs = require("fs");
const path = require("path");

// warehouse:method
// responsibility: Writes a packet result file with unique name to prevent write contention
// actor: worker_bee_infrastructure
// role: data_access
// source_truth: implementation
function writePart(runDir, { pass, packetIndex, oversize, results }) {
  const name = `packet-p${pass || 1}-${String(packetIndex).padStart(4, "0")}.json`;
  const part = { pass: pass || 1, packet_index: packetIndex, oversize: !!oversize, ts: new Date().toISOString(), results };
  fs.writeFileSync(path.join(runDir, name), JSON.stringify(part), "utf8");
}

module.exports = { writePart };
