// warehouse:file
// responsibility: Composes and exports CLI output functions for rendering sessions, rounds, artifacts and coordinating process exit messaging
// actor: cli
// role: output_compositor
// source_truth: implementation

const { renderArtifact } = require("./renderers/artifact-renderer");
const { renderSession } = require("./renderers/session-renderer");
const { renderRound } = require("./renderers/round-renderer");

// warehouse:method
// responsibility: Outputs exit message to console and terminates process with given exit code
// actor: cli
// role: output_coordinator
// source_truth: implementation
function exit(code, message = null) {
  if (message) {
    if (code === 0) {
      console.log(message);
    } else {
      console.error(message);
    }
  }
  process.exit(code);
}

module.exports = {
  renderSession,
  renderRound,
  renderArtifact,
  exit
};
