// warehouse:file
// responsibility: Formats session creation result as JSON or human-readable text
// actor: method_implementation
// role: implementation
// source_truth: implementation

// warehouse:method
// responsibility: Formats session creation result as JSON or human-readable text
// actor: method_implementation
// role: implementation
// source_truth: implementation
function renderStartOutput(session, options = {}) {
  if (options.json) {
    return JSON.stringify({ sessionId: session.id, ok: true }, null, 2);
  }

  let output = `Session started: ${session.id}`;
  if (session.intent && session.intent.task_definition) {
    output += `\n\nTask: ${session.intent.task_definition}\n`;
  }
  return output;
}

module.exports = { renderStartOutput };
