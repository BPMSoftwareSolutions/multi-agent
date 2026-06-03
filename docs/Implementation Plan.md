# Implementation Plan: Stage-Based Multi-Agent Studio

> Generated: 2026-03-28
> Revised: 2026-03-28 — incorporates team review feedback
> Based on: [Stage-Based Multi-Agent Studio.md](./Stage-Based%20Multi-Agent%20Studio.md)

---

## File Structure

19 files total. No build step, no transpiler, no bundler.

```
multi-agent-studio/
├── package.json
├── .env.example
├── .gitignore
├── server/
│   ├── index.js              ← Express entry + port binding
│   ├── app.js                ← Express app factory, routes mounted here
│   ├── config/
│   │   └── stages.js         ← Stage definitions, schemas, role instructions (build first)
│   ├── session/
│   │   └── store.js          ← In-memory Map + CRUD helpers
│   ├── prompts/
│   │   ├── intent.js         ← Intent normalization prompt (runs at session start)
│   │   ├── builder.js        ← Builder prompt constructor
│   │   ├── reviewer.js       ← Reviewer prompt constructor
│   │   ├── synthesizer.js    ← Synthesizer prompt constructor
│   │   └── helpers.js        ← schemaToText, buildRoundContext, escaping
│   ├── llm/
│   │   └── client.js         ← Anthropic SDK wrapper, extractJSON, retry logic
│   ├── routes/
│   │   ├── session.js        ← POST /session/start, GET /session/:id
│   │   ├── round.js          ← POST /round/run (most complex route)
│   │   ├── artifact.js       ← POST /artifact/accept
│   │   └── stage.js          ← POST /stage/advance
│   └── middleware/
│       └── validate.js       ← Request body validation helpers
└── public/
    ├── index.html            ← Single page, full layout
    ├── style.css             ← All styles, CSS custom properties
    └── app.js                ← Frontend state machine + API calls + rendering
```

---

## Build Sequence

### Phase 1 — Skeleton (no LLM, no API calls)

**Step 1: `server/config/stages.js`**
Everything downstream depends on this. Define all three stage configs, schemas, and role instruction strings in one place. Build this first so every other file can import it.

**Step 2: `server/session/store.js`**
A plain JS `Map`. Functions: `createSession(brief)`, `getSession(id)`, `updateSession(id, patch)`. Returns `null` on miss. Needs `stages.js` to populate the initial session shape.

**Step 3: `server/app.js` + `server/index.js`**
Express app with `express.json()`, CORS headers, and the four route groups mounted. Static middleware pointing at `/public`. Stub routes return `501 Not Implemented` so the server starts and 404s cleanly.

**Step 4: `public/index.html` + `public/style.css`**
Hard-code the four-zone layout with static placeholder text. Confirm visual structure works before wiring anything. Use CSS Grid rows: header / negotiation-columns / artifact / actions. Use CSS Grid columns for the three negotiation panels.

**Step 5: `public/app.js` — state + rendering only (no fetch)**
Define the `AppState` object (see section below). Write `renderAll(state)` which dispatches to each panel renderer. Seed with mock data. Confirm everything renders before touching the backend.

---

### Phase 2 — Backend logic

**Step 6: `server/routes/session.js`**
Implement `POST /session/start` and `GET /session/:id` using the store. On session start, run the intent normalization prompt (see `prompts/intent.js`) against the user's brief before returning. Store the result as `session.intent`. Return the full session shape including `intent`. Test with curl before moving on.

**Step 7: `server/llm/client.js`**
Anthropic SDK wrapper. Single exported function `callClaude({ system, userMessages, maxTokens })`. Include `extractJSON(text)` with three-pass logic: direct parse → strip fences → find first `{...}`. Include `callClaudeWithRetry(params, maxAttempts=2)` — on JSON parse failure, append a repair instruction to the messages array and retry once.

**Step 8: `server/prompts/` (all five files)**
Build all four prompt constructors (intent + builder + reviewer + synthesizer). Each of builder/reviewer/synthesizer takes `{ stage, intent, artifact, lastRound, humanInterjection }`. Note `lastRound` not `priorRounds` — context is kept tight (see Context Budget section). Return `{ system, messages }` ready to pass to `callClaude`. The helpers file provides `schemaToText(schema)` and `buildRoundContext(lastRound)` — the latter produces a compact summary of the previous round only.

**Step 9: `server/routes/round.js`**
Implement `POST /round/run`. Orchestrate: call builder → call reviewer → call synthesizer. Calls are **sequential**, not concurrent (reviewer must receive builder output as context). Store the round. Return `{ builder, reviewer, synthesis, roundNumber }` — where `synthesis` is the full synthesizer output object (see Synthesizer Output section), not just the artifact.

**Step 10: `server/routes/artifact.js` + `server/routes/stage.js`**
Simple state mutations. Accept marks `stages[stage].accepted = true` and sets `stages[stage].artifact` to the last proposed artifact. Advance validates the current stage is accepted, increments `currentStage`, returns new stage.

---

### Phase 3 — Frontend wired to backend

**Step 11: Wire `public/app.js` fetch calls**
Replace mock data with real API calls. One async function per action: `startSession`, `runRound`, `acceptArtifact`, `advanceStage`, `fetchSession`. After every action, fetch the full session and call `renderAll`.

**Step 12: Loading, error, and status states**
Add `state.loading` flag. Disable all action buttons during loading. Show per-panel loading messages ("Running Builder...", "Running Reviewer..."). Show a top-level error banner on failures.

**Step 13: Per-stage artifact rendering**
Each stage schema needs a dedicated renderer producing readable HTML (not raw JSON): `renderIdeaArtifact`, `renderAsciiArtifact`, `renderPlanArtifact`. For ASCII specifically, render `layout` in a `<pre>` block (whitespace-significant).

---

### Phase 4 — Polish

**Step 14: Round history display**
Each panel accumulates prior rounds in a scrollable history. Show round number labels. Collapse old rounds by default.

**Step 15: Export**
Add "Copy JSON" and "Copy Markdown" buttons to the artifact panel. Markdown export is a simple serializer per stage schema.

---

## Key Implementation Decisions

| Decision | Choice | Reason |
|---|---|---|
| LLM calls per round | **Sequential** | Reviewer must see Builder's output; parallel calls kill the tension |
| Proposed artifact commit | **Manual, on accept only** | Preserves human authority — synthesizer output is a proposal, not auto-saved |
| API key placement | **Backend only** | Never exposed to the frontend |
| Stage advancement guard | **Backend validates** | Returns `400` if current stage not accepted; don't trust the frontend |
| JSON repair strategy | **Single retry with repair message** | Handles 95% of model slippage with no extra dependencies |
| State after round | **`proposedArtifact` not committed** | `POST /round/run` stores the round but does NOT update `session.stages[stage].artifact` — only `POST /artifact/accept` does |
| Prompt context | **Artifact-first, not transcript-first** | Only pass current artifact + last round summary; raw transcript replay causes the system to manage its own structure instead of the problem |
| Reviewer output shape | **Three critique dimensions** | `intent_issues`, `complexity_issues`, `validity_issues` stay distinct — collapsing them into one `critiques` array hides important signal |
| Synthesizer output shape | **Artifact + metadata** | Returns `artifact`, `change_summary`, `retained_complexity`, `removed_complexity`, `open_tradeoffs` — makes synthesis auditable, not just a black box merge |
| Intent normalization | **Pre-stage, at session start** | Run once on the brief to derive `task_definition`, `success_criteria`, `constraints`, `open_questions` — passed to all prompts throughout the session |

---

## Critical Implementation Details

### Reviewer returns three distinct critique dimensions
The reviewer returns:
```json
{
  "intent_issues": [],
  "complexity_issues": [],
  "validity_issues": [],
  "suggested_artifact": {}
}
```
Do not collapse these into a single `critiques` array. Keeping them distinct preserves the difference between "this misses the goal" (intent), "this is over-engineered" (complexity), and "this is technically wrong" (validity). Each dimension renders as a separate section in the Reviewer panel. `suggested_artifact` feeds into the synthesizer.

### Round stores both before and after
Each round stored in `session.stages[stage].rounds` must include `artifactBefore` (snapshot at round start) and `artifactAfter` (the proposed artifact from synthesis). This enables diff display and gives future prompts "what changed last round" without recomputing.

### Stage 1 Round 1 is a special case
When `artifact` is `{}` and `roundNumber === 1`, the builder prompt must say:
> "User brief: {brief}. Create the initial idea artifact."

Not the standard "improve the artifact" framing. Check `round.roundNumber === 1 && stage === 'idea'` in the builder prompt constructor.

### `POST /round/run` does NOT commit the artifact
The route stores the round and returns `proposedArtifact`. The artifact panel shows it with a "Proposed" badge / visual indicator. Only `POST /artifact/accept` commits it to session state. This is the most important UX principle in the system.

### ASCII `layout` field
Render in `<pre>` with monospace font, no wrapping. Whitespace is significant. All other artifact fields render as normal HTML.

### Human interjection is always optional
`POST /round/run` accepts `humanInterjection` as a string or empty string. Prompt constructors emit `"(no human instruction for this round)"` rather than `undefined` or an empty line.

### Context budget: artifact-first, not transcript-first
Prompt constructors accept `lastRound` (the single most recent round object), not `priorRounds` (the full history). Pass only:
- current accepted artifact
- latest proposed artifact (from `lastRound.artifactAfter`)
- a compact one-paragraph summary of what changed last round
- the latest human interjection

Do not replay raw transcript history. Passing full round history causes prompts to grow unboundedly and shifts model attention toward managing the conversation rather than the artifact.

### Intent is always in scope
`session.intent` is derived once at session start and passed into every Builder, Reviewer, and Synthesizer prompt for the entire session. It anchors all negotiation to the original task definition, success criteria, and constraints. Never omit it from prompts to save tokens — it is the mechanism that prevents the system from solving the wrong problem cleanly.

---

## Prompt Templates

Each prompt constructor takes `{ stage, intent, artifact, lastRound, humanInterjection }` and returns `{ system, messages }`. `intent` is always included — it is the anchor that keeps negotiation aligned with the original task definition.

### Builder Prompt

**System:**
```
You are the Builder AI in a stage-based design workshop.
Your role: propose the most concrete, compelling version of the current artifact.
Be specific. Make decisions. Avoid hedge phrases.
Return your response as a JSON object matching the schema below.
Do not include explanation outside the JSON.

Stage: {stage.label}
Stage goal: {stage.builderFocus}

Task intent (do not drift from this):
- Task: {intent.task_definition}
- Success criteria: {intent.success_criteria.join(", ")}
- Constraints: {intent.constraints.join(", ")}

Required schema:
{schemaToText(stage.schema)}

Current artifact (your starting point — improve it):
{JSON.stringify(currentArtifact, null, 2)}
```

**User message:**
```
{humanInterjection || "Continue developing the artifact. Make it more concrete and specific."}

Last round context:
{buildRoundContext(lastRound)}

Return only the updated artifact JSON. No explanation.
```

---

### Reviewer Prompt

**System:**
```
You are the Reviewer AI in a stage-based design workshop.
Your role: identify weaknesses in the Builder's proposal across three distinct dimensions.
For each issue, propose a specific correction — not just a problem statement.

Stage: {stage.label}
Stage goal: {stage.reviewerFocus}

Task intent (use this to judge alignment):
- Task: {intent.task_definition}
- Success criteria: {intent.success_criteria.join(", ")}
- Constraints: {intent.constraints.join(", ")}

Required schema for suggested_artifact:
{schemaToText(stage.schema)}
```

**User message:**
```
Builder's proposed artifact:
{JSON.stringify(builderOutput, null, 2)}

Current accepted artifact (baseline):
{JSON.stringify(currentArtifact, null, 2)}

{humanInterjection ? "Human instruction: " + humanInterjection : ""}

Return JSON with exactly these fields:
{
  "intent_issues": [],       // misalignments with the task definition or success criteria
  "complexity_issues": [],   // over-engineering, unnecessary scope, or premature abstraction
  "validity_issues": [],     // technical errors, missing constraints, logical gaps
  "suggested_artifact": {}   // your improved version of the full artifact
}
```

---

### Synthesizer Prompt

**System:**
```
You are the Synthesizer in a stage-based design workshop.
Your role: merge the Builder proposal, Reviewer critiques, and Human instruction
into one improved artifact.
Do not average them — make a judgment call about what produces the best outcome.
Preserve all good details from the current artifact. Do not discard specifics without reason.
Make unresolved tradeoffs explicit rather than silently choosing one side.

Stage: {stage.label}
Required schema for artifact:
{schemaToText(stage.schema)}

Task intent (do not drift from this):
- Task: {intent.task_definition}
- Success criteria: {intent.success_criteria.join(", ")}
- Constraints: {intent.constraints.join(", ")}
```

**User message:**
```
Current accepted artifact:
{JSON.stringify(currentArtifact, null, 2)}

Builder proposed:
{JSON.stringify(builderOutput, null, 2)}

Reviewer critiques and suggested artifact:
{JSON.stringify(reviewerOutput, null, 2)}

Human instruction: {humanInterjection || "(none)"}

Return JSON with exactly these fields:
{
  "artifact": {},              // the synthesized artifact matching the required schema
  "change_summary": [],        // what changed from the accepted artifact and why
  "retained_complexity": [],   // complexity kept because it belongs to the problem
  "removed_complexity": [],    // complexity removed as accidental or premature
  "open_tradeoffs": []         // decisions that were not resolved — surface them, don't hide them
}
```

---

### Intent Normalization Prompt (`prompts/intent.js`)

Runs once inside `POST /session/start` before any stage begins.

**System:**
```
You are an intent interpreter. Your role is to clarify a user's brief before any design work begins.
Extract the core task definition, success criteria, constraints, and open questions.
Be concise. Do not invent scope. Surface ambiguity rather than resolve it.
Return only JSON.
```

**User message:**
```
User brief: {brief}

Return JSON:
{
  "task_definition": "",      // one sentence: what is being built and for whom
  "success_criteria": [],     // what does a good outcome look like
  "constraints": [],          // known limits (time, scope, technology, non-goals)
  "open_questions": []        // genuine ambiguities that should be resolved before or during work
}
```

---

### `schemaToText` Output Example (idea stage)

```
Fields required in your JSON response:
- name (string): the product name
- concept (string): one-sentence product concept
- target_user (string): primary user persona
- core_loop (string): the key repeated action the user takes
- value (string): why this matters to the user
- risks (array of strings): known risks or open questions
```

Generated programmatically from the stage schema object — automatically correct for all stages.

---

## Frontend State Shape

```javascript
const AppState = {
  // Session
  sessionId: null,           // string | null
  currentStage: null,        // "idea" | "ascii" | "plan" | null
  intent: null,              // { task_definition, success_criteria, constraints, open_questions }
  stages: {                  // mirrors server session.stages
    idea:  { artifact: null, accepted: false, rounds: [] },
    ascii: { artifact: null, accepted: false, rounds: [] },
    plan:  { artifact: null, accepted: false, rounds: [] }
  },

  // Round in progress
  pendingRound: {
    roundNumber: null,
    builder: null,           // { artifact: object }
    reviewer: null,          // { intent_issues, complexity_issues, validity_issues, suggested_artifact }
    synthesis: null,         // { artifact, change_summary, retained_complexity, removed_complexity, open_tradeoffs }
    humanInterjection: "",   // current textarea value
    artifactBefore: null
  },

  // UI state
  loading: false,
  loadingMessage: "",        // "Running Builder...", "Running Reviewer...", etc.
  error: null,               // string | null — shown in error banner
  view: "start"              // "start" | "working" | "done"
};
```

**State transitions:**
- `"start"` → user enters brief → `POST /session/start` → `"working"`
- `"working"` → round loop until all stages accepted → `"done"`
- Any fetch error → `AppState.error` set → banner shown, loading cleared

**`renderAll(state)` dispatches to:**
- `renderHeader(state)` — stage name, round count, accepted indicator
- `renderBuilderPanel(state)` — latest builder output, prior rounds collapsed
- `renderReviewerPanel(state)` — latest reviewer output with critique list
- `renderHumanPanel(state)` — textarea bound to `pendingRound.humanInterjection`
- `renderArtifactPanel(state)` — proposed or accepted artifact via stage-specific renderer
- `renderActions(state)` — buttons enabled/disabled based on state

---

## Token Budget Strategy

| Role | Max Tokens | Reason |
|---|---|---|
| Builder | 1024 | Forces concise proposals |
| Reviewer | 1024 | Forces prioritized critiques, not a wall of text |
| Synthesizer | 2048 | Richer output (artifact + change summary + tradeoffs) needs more headroom |

All configurable via `.env`.

---

## Dependencies

```json
{
  "name": "multi-agent-studio",
  "version": "1.0.0",
  "private": true,
  "engines": { "node": ">=18.0.0" },
  "scripts": {
    "start": "node server/index.js",
    "dev": "node --watch server/index.js"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.37.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "express": "^4.18.0",
    "uuid": "^9.0.0"
  }
}
```

Use `node --watch` (Node 18+ built-in) — no nodemon needed.

---

## `.env.example`

```
ANTHROPIC_API_KEY=sk-ant-...
PORT=3030
MODEL=claude-sonnet-4-6
MAX_TOKENS_INTENT=512
MAX_TOKENS_BUILDER=1024
MAX_TOKENS_REVIEWER=1024
MAX_TOKENS_SYNTHESIZER=2048
```

---

## Architecture Guardrail

> **New roles, loops, or persistence layers may only be added when a concrete failure mode has been observed in the current system.**

Before adding any of the following after v1:
- persistence / save-load
- branching / version graphs
- configurable agent personas
- additional agent roles
- self-reflection or meta-auditor loops

...require a written justification covering:
1. What failure exists now in the running system
2. What breaks without this addition
3. Why this is essential rather than ceremonial

This rule exists because the anti-complexity system can itself become accidental complexity. The danger begins when the team starts managing the system more than the problem.

---

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| AI outputs become repetitive | Structured outputs + concise role instructions + last-round context only |
| Reviewer becomes purely destructive | Require `suggested_artifact` alongside critiques — must propose, not just criticise |
| Reviewer critique is unfocused | Three distinct dimensions (`intent_issues`, `complexity_issues`, `validity_issues`) force prioritization |
| System drifts from original brief | `session.intent` derived at start and injected into every prompt throughout the session |
| Shared artifact loses good details | Always pass previous artifact into synthesis; require full artifact output every time |
| Synthesis hides unresolved tradeoffs | Synthesizer must emit `open_tradeoffs` — surfacing beats silently averaging |
| Prompt context grows unboundedly | Strict context budget: current artifact + last round summary + latest interjection only |
| JSON parsing failures | Three-pass extraction + single repair retry |
| UI feels like a chatbot | Artifact panel is visually dominant and persistent; transcript panels are secondary |
| Stages feel arbitrary | Defined input/output contracts; backend enforces stage gate on advance |
| System grows into ceremony | Architecture guardrail: no new roles/layers without observed failure mode |

---

## Success Criteria for MVP

A successful v1:
> A single-page app where a user enters a brief, two AI roles negotiate around a stage-specific artifact, the user can intervene as a third role, and the artifact advances from Idea to ASCII Sketch to Implementation Plan.

**Functional checks:**
- Can complete Idea → ASCII → Plan in one session
- Human interjections visibly affect artifact outcomes
- Artifact remains structured and readable throughout
- No critical crashes in normal use
- Stage transitions require explicit user acceptance
