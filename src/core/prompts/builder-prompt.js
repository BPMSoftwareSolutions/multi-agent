// warehouse:file
// responsibility: Builds planner prompt: combines stage goal, intent, artifact, and human feedback for proposal
// actor: core_runtime
// role: prompt_builder
// source_truth: implementation

const { formatSystemMessage } = require("./prompt-formatter");
const { buildTaskLine, buildContextLines, buildUserMessage } = require("./context-builder");

// warehouse:method
// responsibility: Composes system message and user task with artifact schema and development context
// actor: method_implementation
// role: implementation
// source_truth: implementation
function buildBuilderPrompt({ stage, intent, artifact, lastRound, humanInterjection, brief, roundNumber }) {
  const isStageOneFirstRound =
    stage.id === "idea" && roundNumber === 1 && Object.keys(artifact || {}).every((key) => {
      const value = artifact[key];
      if (Array.isArray(value)) return value.length === 0;
      return value === "";
    });

  const system = formatSystemMessage({ stage, intent, artifact });
  const taskLine = buildTaskLine({ stage, brief, roundNumber, isStageOneFirstRound });
  const context = buildContextLines({ lastRound, humanInterjection });
  const userContent = buildUserMessage({ taskLine, context });

  return {
    system,
    messages: [
      {
        role: "user",
        content: userContent
      }
    ]
  };
}

module.exports = { buildBuilderPrompt };
