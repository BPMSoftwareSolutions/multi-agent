// warehouse:file
// responsibility: Formats next-stage command output for CLI display in JSON or text
// actor: cli
// role: renderer
// source_truth: implementation

// warehouse:method
// responsibility: Formats stage advancement result as JSON or human-readable text
// actor: method_implementation
// role: implementation
// source_truth: implementation
function renderNextStageOutput(session, nextStageId, options = {}) {
  if (options.json) {
    return JSON.stringify(
      {
        ok: true,
        sessionId: session.id,
        previousStage: session.stages[nextStageId] ? session.currentStage : undefined,
        currentStage: nextStageId,
        completed: session.completed
      },
      null,
      2
    );
  }

  let output = `Advanced to stage: ${nextStageId}`;
  if (session.completed) {
    output += "\n\nSession completed! All stages finished.";
  }
  return output;
}

module.exports = { renderNextStageOutput };
