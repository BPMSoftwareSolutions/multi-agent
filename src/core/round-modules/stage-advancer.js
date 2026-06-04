// warehouse:file
// responsibility: Manages artifact acceptance and stage progression: advances session to next stage after validating acceptance
// actor: orchestration
// role: stage_progression
// source_truth: implementation

// warehouse:method
// responsibility: undefined
// actor: undefined
// role: undefined
// source_truth: implementation

async function advanceStage(session) {
  const { STAGE_ORDER } = require("../stages");
  const currentIndex = STAGE_ORDER.indexOf(session.currentStage);

  if (currentIndex === -1 || currentIndex >= STAGE_ORDER.length - 1) {
    throw new Error("Cannot advance from the final stage");
  }

  if (!session.stages[session.currentStage].accepted) {
    throw new Error("Current stage artifact must be accepted before advancing");
  }

  const nextStageId = STAGE_ORDER[currentIndex + 1];
  session.currentStage = nextStageId;

  return nextStageId;
}

module.exports = { advanceStage };
