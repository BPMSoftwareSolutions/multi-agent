// warehouse:file
// responsibility: Outputs exit message and terminates process with specified exit code
// actor: cli
// role: process_terminator
// source_truth: implementation

// warehouse:method
// responsibility: Outputs exit message and terminates process with specified exit code
// actor: method_implementation
// role: implementation
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

module.exports = { exit };
