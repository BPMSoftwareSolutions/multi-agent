# Project Plan: Stage-Based Multi-Agent Studio

## 1. Project Summary

**Working name:** Stage-Based Multi-Agent Studio

**Concept:**
A prompt-first app where:

* **AI 1** proposes
* **AI 2** critiques
* **Human** jumps in as the third role
* the system updates a **shared artifact**
* the artifact progresses through stages such as:

  * Idea
  * ASCII Sketch
  * Implementation Plan
  * later: Schema, Prompts, Build Tasks, etc.

**Core product promise:**
Turn vague ideas into progressively more concrete artifacts through structured multi-agent negotiation.

---

## 2. Product Goals

### Primary goals

* Make AI collaboration feel like a **design workshop**, not a chatbot
* Let the user **intervene at any point**
* Keep every stage centered on a **shared evolving artifact**
* Support **progressive refinement** from abstract idea to build-ready plan
* Keep the initial version lightweight and understandable

### Non-goals for v1

* full code generation
* persistent team collaboration
* complex branching/version graphs
* plugin system
* real-time multiplayer
* production-grade auth

---

## 3. Core User Flow

```text
User enters idea
   ↓
Stage 1: Idea negotiation
   ↓
Shared idea draft accepted
   ↓
Stage 2: ASCII sketch negotiation
   ↓
Shared sketch accepted
   ↓
Stage 3: Implementation plan negotiation
   ↓
Shared plan accepted
   ↓
Export / continue to later stages
```

---

## 4. MVP Scope

## Included in v1

### Stages

* Idea
* ASCII Sketch
* Implementation Plan

### Roles

* Builder AI
* Reviewer AI
* Human Interjector

### Core features

* stage selector / stage progression
* prompt input
* two AI responses per round
* human interjection input
* shared artifact panel
* synthesize/update artifact action
* accept current artifact
* move to next stage
* simple round history in memory

### Output model

Each stage has:

* a schema
* a current artifact object
* a negotiation transcript for that stage
* a synthesized canonical draft

---

## 5. Product Principles

## A. Artifact-first

The main thing on screen is not the transcript.
It is the **current accepted draft**.

## B. Structured stages

Each stage has a defined purpose, inputs, outputs, and schema.

## C. Human authority

The user can redirect, constrain, approve, or reject before updates happen.

## D. Negotiation as refinement

AI disagreement should improve quality, not create noise.

## E. Progressive concreteness

Each stage should produce something more actionable than the last.

---

## 6. Stage Definitions

# Stage 1: Idea

### Goal

Define the product concept clearly.

### Input

* initial user brief

### Output artifact

```json
{
  "name": "",
  "concept": "",
  "target_user": "",
  "core_loop": "",
  "value": "",
  "risks": []
}
```

### Builder focus

* propose a compelling concept
* make it concrete

### Reviewer focus

* expose vagueness
* identify missing constraints
* challenge differentiation

---

# Stage 2: ASCII Sketch

### Goal

Translate concept into visible UI structure.

### Input

* accepted idea artifact

### Output artifact

```json
{
  "layout": "",
  "regions": [],
  "interaction_notes": "",
  "open_questions": []
}
```

### Builder focus

* propose layout
* define major regions
* make workflow visible

### Reviewer focus

* find clutter
* identify UX confusion
* improve information hierarchy

---

# Stage 3: Implementation Plan

### Goal

Convert concept + sketch into build steps.

### Input

* accepted idea artifact
* accepted ASCII artifact

### Output artifact

```json
{
  "mvp_scope": [],
  "frontend_components": [],
  "backend_endpoints": [],
  "state_model": [],
  "milestones": [],
  "deferred": []
}
```

### Builder focus

* propose a realistic implementation sequence

### Reviewer focus

* cut unnecessary scope
* identify technical risks
* push toward shippable MVP

---

## 7. Functional Requirements

## 7.1 Session Management

The app should maintain a single in-memory session with:

* current stage
* current round
* artifacts by stage
* transcript by stage
* user interjections
* accepted state flags

### Data shape

```json
{
  "sessionId": "uuid",
  "currentStage": "idea",
  "stages": {
    "idea": {
      "artifact": {},
      "accepted": false,
      "rounds": []
    },
    "ascii": {
      "artifact": {},
      "accepted": false,
      "rounds": []
    },
    "plan": {
      "artifact": {},
      "accepted": false,
      "rounds": []
    }
  }
}
```

---

## 7.2 Negotiation Round

Each round should support:

* current artifact as context
* Builder AI response
* Reviewer AI response
* optional human interjection
* synthesized updated artifact

### Round structure

```json
{
  "roundNumber": 1,
  "builder": {},
  "reviewer": {},
  "human": "",
  "synthesis": {},
  "artifactBefore": {},
  "artifactAfter": {}
}
```

---

## 7.3 Human Interjection

The human should be able to:

* add constraints
* reject both AI directions
* request specific changes
* force tradeoffs
* decide when to stop negotiating

Examples:

* “Make it more minimal.”
* “This should feel like a workshop, not chat.”
* “Cut persistence from v1.”
* “Keep the artifact in the center.”

---

## 7.4 Artifact Update Flow

Recommended round sequence:

```text
1. Builder responds
2. Reviewer responds
3. Human interjects
4. Synthesizer updates shared artifact
5. User accepts or continues
```

This is important because it preserves user control.

---

## 8. UI Plan

# Main Layout

```text
+------------------------------------------------------------------------------+
| Header: Project / Stage / Round / Status                                     |
+------------------------------------------------------------------------------+
| Builder AI            | Reviewer AI           | Human Interjection            |
| message stream        | message stream        | input + send                  |
+------------------------------------------------------------------------------+
| Shared Artifact                                                               |
| canonical current draft                                                       |
+------------------------------------------------------------------------------+
| Actions: [Next Round] [Accept] [Next Stage] [Reset]                          |
+------------------------------------------------------------------------------+
```

---

## 8.1 UI Areas

### Header

Shows:

* app title
* current stage
* round number
* negotiation status

### Builder panel

Shows latest Builder output and optionally prior messages.

### Reviewer panel

Shows latest Reviewer output and optionally prior messages.

### Human panel

Input box + action buttons.

### Shared Artifact panel

Shows the accepted or proposed artifact in readable form.

### Actions row

Buttons:

* Run Round
* Update Artifact
* Accept Draft
* Move to Next Stage
* Restart Stage

---

## 9. Technical Architecture

## Frontend

**Vanilla HTML / CSS / JS**

### Responsibilities

* render stage state
* display transcript
* display artifact
* capture user input
* call backend endpoints
* update UI based on returned JSON

## Backend

Small Node/Express server

### Responsibilities

* manage session state
* store stage config
* construct prompts
* call LLM
* synthesize outputs into artifact updates
* validate returned JSON

## LLM Integration

Use role-based prompts rather than separate actual “agents”.

Each round likely uses:

* Builder prompt
* Reviewer prompt
* Synthesizer prompt

---

## 10. Prompt Architecture

## 10.1 Prompt Layers

Each prompt should include:

### System role

Defines the role:

* Builder
* Reviewer
* Synthesizer

### Stage instructions

Defines what stage is being worked on.

### Schema contract

Defines required fields.

### Current artifact

Gives current shared draft context.

### Prior messages

Optional short round memory.

### Human instruction

Injects the latest user steer.

---

## 10.2 Example pipeline

```text
Current stage config
   +
Current artifact
   +
Latest user steer
   ↓
Builder prompt
   ↓
Reviewer prompt
   ↓
Synthesizer prompt
   ↓
Updated artifact JSON
```

---

## 11. Stage Engine Design

The app should be stage-config driven.

## Example stage config

```javascript
const stages = {
  idea: {
    label: "Idea",
    schema: {
      name: "string",
      concept: "string",
      target_user: "string",
      core_loop: "string",
      value: "string",
      risks: "string[]"
    }
  },
  ascii: {
    label: "ASCII Sketch",
    schema: {
      layout: "string",
      regions: "string[]",
      interaction_notes: "string",
      open_questions: "string[]"
    }
  },
  plan: {
    label: "Implementation Plan",
    schema: {
      mvp_scope: "string[]",
      frontend_components: "string[]",
      backend_endpoints: "string[]",
      state_model: "string[]",
      milestones: "string[]",
      deferred: "string[]"
    }
  }
};
```

This makes later stages easy to add.

---

## 12. API Plan

## `POST /session/start`

Creates a new session.

### Input

```json
{
  "brief": "Build a stage-based multi-agent studio"
}
```

### Output

```json
{
  "sessionId": "...",
  "currentStage": "idea",
  "artifact": {}
}
```

---

## `POST /round/run`

Runs Builder + Reviewer for the current stage.

### Input

```json
{
  "sessionId": "...",
  "humanInterjection": "Make the flow feel like collaborative design review"
}
```

### Output

```json
{
  "builder": {},
  "reviewer": {},
  "proposedArtifact": {}
}
```

---

## `POST /artifact/accept`

Accepts the current artifact.

### Input

```json
{
  "sessionId": "...",
  "stage": "idea"
}
```

---

## `POST /stage/advance`

Moves to the next stage.

### Input

```json
{
  "sessionId": "..."
}
```

### Output

```json
{
  "currentStage": "ascii"
}
```

---

## `GET /session/:id`

Returns all current state needed for rendering.

---

## 13. Milestones

# Milestone 1: Define product contract

### Deliverables

* stage definitions
* schemas
* artifact shapes
* role responsibilities
* negotiation round model

### Success criteria

* clear stage inputs/outputs
* no ambiguity around current artifact model

---

# Milestone 2: Build static frontend shell

### Deliverables

* single-page HTML
* three-column negotiation layout
* shared artifact panel
* actions row
* placeholder data rendering

### Success criteria

* stage switching works locally
* UI is understandable without AI

---

# Milestone 3: Build backend session engine

### Deliverables

* in-memory session store
* stage config loading
* route scaffolding
* round history storage

### Success criteria

* can start session and move across stages

---

# Milestone 4: Implement AI round flow

### Deliverables

* Builder prompt
* Reviewer prompt
* Synthesizer prompt
* JSON parsing/validation
* round update logic

### Success criteria

* a full stage round produces usable artifact updates

---

# Milestone 5: Connect UI to backend

### Deliverables

* start session from prompt
* run round
* render responses
* update shared artifact
* accept and advance

### Success criteria

* complete end-to-end MVP works for 3 stages

---

# Milestone 6: Polish

### Deliverables

* loading states
* error handling
* artifact readability
* diff/change notes
* stage progress clarity

### Success criteria

* flow feels coherent and pleasant to use

---

## 14. Work Breakdown

## Frontend tasks

* create page layout
* create stage header
* create Builder panel renderer
* create Reviewer panel renderer
* create human input panel
* create shared artifact renderer
* create action buttons
* wire API calls
* add status/loading/error states

## Backend tasks

* create Express server
* create session store
* define stage configs
* define prompt builders
* implement round orchestration
* implement artifact synthesis
* add JSON validation/retry logic
* implement stage advancement

## Prompt/system tasks

* draft Builder role prompt
* draft Reviewer role prompt
* draft Synthesizer role prompt
* create schema-to-prompt helper
* create stage-specific instruction templates

---

## 15. Risks and Mitigations

## Risk: AI outputs become repetitive or noisy

**Mitigation:**
Use structured outputs and concise role instructions.

## Risk: Reviewer becomes purely destructive

**Mitigation:**
Require constructive critique with suggested fixes.

## Risk: Shared artifact drifts or loses good details

**Mitigation:**
Always pass previous artifact into synthesis and require full updated artifact output.

## Risk: UI feels like just another chatbot

**Mitigation:**
Make the artifact visually central and persistent.

## Risk: Stages feel arbitrary

**Mitigation:**
Define clear input/output contracts and stage transition rules.

## Risk: JSON parsing failures

**Mitigation:**
Strict output schemas, validation, and repair pass.

---

## 16. Success Metrics for MVP

### Qualitative

* user feels they can steer the conversation
* outputs improve over rounds
* stage transitions feel natural
* artifact becomes meaningfully more concrete each stage

### Functional

* can complete Idea → ASCII → Plan in one session
* no critical crashes in normal use
* artifact remains structured and readable
* human interjections visibly affect outcomes

---

## 17. Recommended Build Order

1. Define stage schemas
2. Build static UI shell
3. Create in-memory session model
4. Implement manual mock round data
5. Add real LLM calls
6. Add synthesis/update flow
7. Add accept/advance logic
8. Polish artifact rendering
9. Add export

---

## 18. Stretch Features After MVP

* branch artifact into alternatives
* compare two negotiated versions
* save/load sessions
* markdown export
* JSON export
* configurable agent personas
* additional stages:

  * Schema
  * Prompts
  * Build Tasks
  * Landing Copy
  * QA Checklist

---

## 19. Suggested v1 Timeline

## Phase 1

**Spec + schemas + wireframes**

* finalize stage definitions
* finalize artifact shapes
* finalize UI shell

## Phase 2

**Core app**

* frontend layout
* session engine
* stage state management

## Phase 3

**AI integration**

* Builder / Reviewer / Synthesizer prompts
* round orchestration
* artifact update logic

## Phase 4

**Usability polish**

* controls
* readability
* error handling
* export

---

## 20. Final MVP Definition

A successful v1 is:

> A single-page app where a user enters a brief, two AI roles negotiate around a stage-specific artifact, the user can intervene as a third role, and the artifact advances from idea to ASCII sketch to implementation plan.

---

## Immediate Next Step

The smartest next artifact to generate is the **Implementation Plan artifact itself**, in more concrete engineering detail:

* file structure
* frontend state shape
* backend route contracts
* prompt templates
* first-pass data models

I can generate that next as a **dev-ready implementation plan** with folders, endpoints, state objects, and task sequencing.
