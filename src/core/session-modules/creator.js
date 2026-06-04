// warehouse:file
// responsibility: Creates and initializes new sessions
// actor: core_runtime
// role: session_creator
// source_truth: implementation

const { v4: uuidv4 } = require("uuid");
const { createEmptyArtifact } = require("../stages");
const { buildOperationsState } = require("../../shared/actions");
const { ensureSchema, saveSessionRow } = require("../../shared/sql-server");

function createSession(brief, intent = null) {
  ensureSchema();
  const sessionId = uuidv4();
  const session = {
    id: sessionId,
    brief,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    currentStage: "idea",
    completed: false,
    intent: intent || { task_definition: "", success_criteria: [], constraints: [], open_questions: [] },
    stages: {
      idea: { artifact: createEmptyArtifact("idea"), proposedArtifact: null, accepted: false, rounds: [] },
      ascii: { artifact: createEmptyArtifact("ascii"), proposedArtifact: null, accepted: false, rounds: [] },
      plan: { artifact: createEmptyArtifact("plan"), proposedArtifact: null, accepted: false, rounds: [] }
    },
    operations: buildOperationsState()
  };
  saveSessionRow(session);
  return session;
}

module.exports = { createSession };
