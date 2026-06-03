// warehouse:file
// responsibility: Defines the three-stage artifact lifecycle (idea, ASCII sketch, plan) with schemas and stage progression rules
// actor: core_runtime
// role: stage_definitions
// source_truth: implementation

const STAGE_ORDER = ["idea", "ascii", "plan"];

const STAGES = {
  idea: {
    id: "idea",
    label: "Idea",
    goal: "Define the product concept clearly.",
    builderFocus: "Propose a compelling and concrete concept.",
    reviewerFocus: "Expose vagueness, missing constraints, and weak differentiation.",
    schema: {
      name: { type: "string", description: "the product name" },
      concept: { type: "string", description: "one-sentence product concept" },
      target_user: { type: "string", description: "primary user persona" },
      core_loop: { type: "string", description: "the key repeated action the user takes" },
      value: { type: "string", description: "why this matters to the user" },
      risks: { type: "string[]", description: "known risks or open questions" }
    }
  },
  ascii: {
    id: "ascii",
    label: "ASCII Sketch",
    goal: "Translate concept into visible UI structure.",
    builderFocus: "Propose layout, regions, and interaction flow.",
    reviewerFocus: "Find clutter, confusion, and hierarchy issues.",
    schema: {
      layout: { type: "string", description: "ascii layout sketch" },
      regions: { type: "string[]", description: "major UI regions" },
      interaction_notes: { type: "string", description: "interaction behavior notes" },
      open_questions: { type: "string[]", description: "unknowns requiring validation" }
    }
  },
  plan: {
    id: "plan",
    label: "Implementation Plan",
    goal: "Convert concept and sketch into practical build steps.",
    builderFocus: "Propose a realistic implementation sequence.",
    reviewerFocus: "Reduce unnecessary scope and identify execution risk.",
    schema: {
      mvp_scope: { type: "string[]", description: "features in MVP" },
      frontend_components: { type: "string[]", description: "frontend pieces to build" },
      backend_endpoints: { type: "string[]", description: "backend APIs to implement" },
      state_model: { type: "string[]", description: "state and data model decisions" },
      milestones: { type: "string[]", description: "ordered implementation milestones" },
      deferred: { type: "string[]", description: "explicitly deferred items" }
    }
  }
};

function createEmptyArtifact(stageId) {
  const stage = STAGES[stageId];
  if (!stage) {
    return {};
  }

  return Object.entries(stage.schema).reduce((artifact, [field, meta]) => {
    artifact[field] = meta.type.endsWith("[]") ? [] : "";
    return artifact;
  }, {});
}

module.exports = {
  STAGE_ORDER,
  STAGES,
  createEmptyArtifact
};
