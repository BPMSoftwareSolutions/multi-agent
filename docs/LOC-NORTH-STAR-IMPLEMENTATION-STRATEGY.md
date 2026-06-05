# LOC North Star Implementation Strategy

## North Star

A release is not complete when code changes land. A release is complete when the user story, acceptance evidence, implementation, taxonomy, filesystem story, README projection, release manifest, observability, and learning record all agree.

The target delivery chain is:

```text
user story
-> acceptance evidence
-> implementation
-> taxonomy coherence
-> filesystem coherence
-> README projection alignment
-> canonical residue check
-> file economy gate
-> release readiness
-> observability
-> learning
-> governed self-heal
```

The studio already has meaningful pieces of this chain: taxonomy scanning, story review, README projection, canonical residue review, file economy review, worker-bee ledgers, and test verification. The missing center is the value trace:

```text
user value
-> user story
-> acceptance scenario
-> implementation file
-> responsibility / actor / role
-> evidence artifact
-> release readiness decision
```

This strategy describes how to get there without pretending the current system is already there.

## Current Readiness

Current strengths:

- `@loc/story-coherence` provides read-only scan, review, reasoning packet, README, and check APIs.
- Codebase story review already gates local taxonomy, filesystem story, README alignment, canonical residue, and file economy.
- The README is generated from evidence rather than treated as independent source truth.
- Worker-bee runs already use packet and ledger patterns that can support governed self-heal.
- The product workshop stage model already captures `target_user`, `core_loop`, and `value` in the idea artifact.

Current blockers:

- User stories are not first-class release artifacts.
- Acceptance scenarios are not linked to changed files or responsibilities.
- `story:check` does not evaluate user value, acceptance evidence, release readiness, or learning records.
- Honest coherence is still being stabilized after the similarity-to-integrity flip.
- Missing taxonomy and false taxonomy still need separate report states.
- README projection can become stale after scan/story artifacts change.

## Strategic Rule

Do not expand the meaning of "coherence" by stuffing more prose into responsibility fields.

Instead, keep responsibility fields narrow and link them outward:

```text
responsibility: what this file or method owns
actor: who owns or operates that behavior
role: what architectural role it plays
value_link: which user story or governance need it serves
acceptance_link: which scenario proves it
evidence_link: which artifact proves the current state
```

Responsibilities should become clearer because the value chain around them is explicit, not because every anchor tries to summarize the whole product.

## Target Architecture

Introduce a delivery-readiness layer alongside the existing story-coherence layer.

Recommended new surfaces:

```text
contracts/loc-delivery-manifest.schema.json
src/delivery/manifest-loader.js
src/delivery/manifest-validator.js
src/delivery/value-trace.js
src/delivery/acceptance-evidence.js
src/delivery/implementation-trace.js
src/delivery/release-readiness.js
src/delivery/learning-record.js
src/observability/delivery-readiness-report.js
cli/loc-delivery.js
tests/verify-loc-delivery-manifest.js
tests/verify-delivery-readiness-report.js
```

Recommended package API additions:

```js
buildDeliveryReadiness(options)
buildDeliveryReasoningPacket(options)
checkDeliveryReadiness(options)
explainDeliveryTrace(target)
```

These can live in `packages/story-coherence` only if they remain read-only. Any mutation or self-heal dispatch belongs outside the read-only package boundary.

## Manifest Model

Create `loc-delivery-manifest.v1` as the canonical bridge between user value and code evidence.

Minimum shape:

```json
{
  "schema": "loc-delivery-manifest.v1",
  "delivery_id": "delivery-2026-06-05-example",
  "intent": {
    "type": "user_story",
    "story_id": "STORY-001",
    "actor": "studio_operator",
    "need": "understand whether coherence work is ready to release",
    "value": "prevent false narratives from passing governance",
    "source": "session:abc123"
  },
  "acceptance": {
    "source": "specs/delivery-readiness.feature",
    "scenarios": [
      {
        "id": "SCN-001",
        "name": "release is blocked when README projection is stale",
        "test_command": "npm run story:check",
        "expected_result": "fails with readme stale evidence"
      }
    ]
  },
  "implementation": {
    "changed_files": [
      {
        "path": "src/observability/codebase-story-review-report.js",
        "reason": "adds delivery readiness gate evidence",
        "responsibility_expected": "Builds codebase story review reports from scan and delivery evidence"
      }
    ]
  },
  "coherence_sources": {
    "taxonomy_scan": "scan-latest",
    "story_review": "codebase-story-review-latest",
    "readme_projection": "README.md"
  },
  "release_gates": {
    "acceptance": "required",
    "local_taxonomy": "required",
    "filesystem_story": "required",
    "readme_alignment": "required",
    "canonical_residue": "required",
    "file_economy": "required",
    "learning_record": "required"
  },
  "learning": {
    "record_path": "reports/delivery-learning/STORY-001.json",
    "future_regressions": []
  }
}
```

The manifest should be human-readable and machine-validated. It becomes the object that lets LOC answer: "What value is this release delivering, and what evidence proves it?"

## Gate Definitions

### 1. Intent Gate

Purpose: prove the release has a declared user story, governance need, or operator request.

Inputs:

- Delivery manifest `intent`
- Accepted studio idea artifact when available
- Optional external issue or PR metadata later

Pass criteria:

- Has actor/persona.
- Has need.
- Has value/outcome.
- Has stable story id or governance request id.

Fail examples:

- "improve coherence" with no user or outcome.
- "refactor files" with no release value.
- "update anchors" with no governance need.

### 2. Acceptance Gate

Purpose: prove the story has executable criteria.

Inputs:

- Gherkin files in `specs/`
- Test command list
- Latest test result evidence

Pass criteria:

- Every story has at least one acceptance scenario.
- Every required scenario maps to a command or verification artifact.
- Latest result is pass, or failure is explicitly blocking release.

Near-term implementation:

- Parse simple `.feature` files enough to extract `Feature`, `Scenario`, `As a`, `I want`, and `So`.
- Record test commands manually in the manifest first.
- Later, add a runner that executes and records result artifacts.

### 3. Implementation Trace Gate

Purpose: prove changed files are connected to the story.

Inputs:

- Manifest `implementation.changed_files`
- Git diff file list
- Taxonomy scan ledger

Pass criteria:

- Every changed source file appears in the manifest or is classified as generated evidence.
- Every changed source file has taxonomy.
- Each changed file has a reason that links to story value, acceptance evidence, or governed self-heal.

Fail examples:

- Changed source file not in manifest.
- Responsibility changed but no value or acceptance link.
- Generated report changed without matching source scan or story-review id.

### 4. Responsibility Integrity Gate

Purpose: keep the current honest coherence effort as a prerequisite.

Inputs:

- `taxonomy-coherence-scan`
- `codebase-story-review-report`
- `story:check`
- Split-responsibility ledger when present

Pass criteria:

- One active evaluator definition.
- Local taxonomy tie-out passes.
- Missing taxonomy and false taxonomy are separate states.
- Method responsibilities are present, specific, distinct from file responsibility, distinct from siblings, and single-concern.

This phase depends on the split-responsibility strategy.

### 5. Architecture Story Gate

Purpose: prove the implementation still belongs where it lives.

Inputs:

- Filesystem story review
- Canonical residue review
- File economy review
- README projection alignment

Pass criteria:

- Files sit in known canonical boundaries or declare a new approved boundary.
- No unresolved canonical residue.
- Small files earn their boundary.
- README source ids match latest scan and story review.

### 6. Release Readiness Gate

Purpose: make release a decision artifact, not a vibe.

Inputs:

- Delivery manifest
- Acceptance gate result
- Story check result
- Test results
- README staleness result
- Delivery readiness report

Pass criteria:

- Every required gate is pass.
- Any waived gate has explicit authority, reason, expiration, and follow-up.
- Readiness report is written to `reports/delivery-readiness/latest.json`.

### 7. Observability Gate

Purpose: prove the release can be watched after it lands.

Inputs:

- Manifest observability section
- Existing telemetry/report hooks
- Runtime or governance signals

Pass criteria:

- The release declares what drift or outcome signal should be monitored.
- For code-only governance changes, the signal may be deterministic reports, not runtime telemetry.
- Self-heal recurrence can be counted if a worker repair happens repeatedly.

### 8. Learning Gate

Purpose: persist what the system learned.

Inputs:

- Delivery learning record
- Gate failures and repairs
- Future regression scenarios

Pass criteria:

- Learning record exists.
- It names what drift was prevented or discovered.
- It records at least one future regression scenario when a gate caught a real defect.

## Implementation Phases

### Phase 0: Stabilize The Current Truth Layer

Goal: make sure LOC is not building value governance on top of a confused coherence scorer.

Tasks:

1. Finish honest coherence stabilization from `docs/SPLIT-RESPONSIBILITY-IMPLEMENTATION-STRATEGY.md`.
2. Consolidate old and new evaluator paths.
3. Fix missing-vs-false taxonomy classification.
4. Make `story:check` and README projection agree again after regenerated scan/story artifacts.
5. Retire or replace `coherence-surgical.json`.

Acceptance gate:

```powershell
$env:WORKER_BEE_REPO_ROOT=(Get-Location).Path
npm run story:scan
npm run story:review
npm run story:readme
npm run story:check
npm run test:evidence
npm run test:taxonomy-case
npm run test:taxonomy-heal
npm run test:taxonomy-heal-run
npm run test:taxonomy-swarm-report
npm run test:taxonomy-scan-report
npm run test:codebase-story-review-report
npm run test:readme-projection
npm run test:story-coherence-package
npm run test:ascii-components
```

### Phase 1: Define The Delivery Manifest Contract

Goal: give the North Star a concrete object.

Tasks:

1. Add `contracts/loc-delivery-manifest.schema.json`.
2. Add fixture manifests under `tests/fixtures/delivery/`.
3. Implement `src/delivery/manifest-validator.js`.
4. Add `tests/verify-loc-delivery-manifest.js`.
5. Add a minimal CLI validation command:

```powershell
node cli/loc-delivery.js validate --manifest path/to/manifest.json
```

Acceptance gate:

- Valid fixture passes.
- Missing user story fails.
- Missing acceptance evidence fails.
- Changed file without reason fails.
- Waiver without authority fails.

### Phase 2: Build Delivery Readiness Report

Goal: combine manifest, test evidence, story evidence, and README evidence into one release decision.

Tasks:

1. Add `src/delivery/release-readiness.js`.
2. Add `src/observability/delivery-readiness-report.js`.
3. Add `cli/loc-delivery.js check`.
4. Write `reports/delivery-readiness/<delivery_id>/readiness.json`.
5. Write `reports/DELIVERY-READINESS-LATEST.md`.

Report sections:

- Intent and value
- Acceptance evidence
- Implementation trace
- Coherence gates
- Architecture story gates
- Release decision
- Waivers
- Learning record
- Follow-up queue

Acceptance gate:

```powershell
node cli/loc-delivery.js check --manifest tests/fixtures/delivery/valid.manifest.json
npm run test:delivery-readiness-report
```

### Phase 3: Link User Value To Responsibilities

Goal: make responsibility clarity value-aware without overloading anchor text.

Tasks:

1. Extend scan/readiness evidence with optional value links from the manifest.
2. Add `src/delivery/value-trace.js`.
3. For each changed file, emit:

```json
{
  "file": "src/example.js",
  "responsibility": "Builds delivery readiness reports from manifest and evidence",
  "actor": "delivery_governance",
  "role": "report_generator",
  "story_id": "STORY-001",
  "value": "prevent false release readiness claims",
  "acceptance_scenarios": ["SCN-001"]
}
```

4. Add a readiness failure when a changed responsibility has no story/value link.

Acceptance gate:

- A changed file with no value trace fails.
- A generated report artifact can pass if it links to source scan/story ids.
- A test-only change can pass if it links to acceptance evidence.

### Phase 4: Acceptance Evidence Integration

Goal: turn Gherkin and test commands into evidence instead of decoration.

Tasks:

1. Add `src/delivery/acceptance-evidence.js`.
2. Parse `.feature` files in a simple deterministic way.
3. Map manifest scenarios to `specs/*.feature` scenario names or ids.
4. Execute declared commands only when explicitly requested:

```powershell
node cli/loc-delivery.js verify --manifest path/to/manifest.json
```

5. Persist command results under:

```text
reports/delivery-readiness/<delivery_id>/acceptance-results.json
```

Acceptance gate:

- Missing scenario id fails.
- Scenario with no verification command is `review_required`.
- Failed command blocks readiness.
- Passing command is recorded with timestamp and output summary.

### Phase 5: Add Learning Records

Goal: persist what the delivery run taught the system.

Tasks:

1. Add `src/delivery/learning-record.js`.
2. Write learning records to:

```text
reports/delivery-learning/<delivery_id>.json
```

3. Capture:

- story delivered
- scenarios proved
- files changed
- gates passed
- gates failed
- drift prevented
- repair packets generated
- future regression scenarios

4. Add a `learning_record` gate to readiness.

Acceptance gate:

- No learning record blocks release unless explicitly waived.
- Any self-heal or failed gate must create at least one lesson or regression candidate.

### Phase 6: Governed Self-Heal Routing

Goal: make repair packets part of delivery recovery without making mutation reckless.

Tasks:

1. Add drift classifiers:
   - `missing_taxonomy`
   - `false_taxonomy`
   - `responsibility_split_required`
   - `readme_stale`
   - `filesystem_boundary_unknown`
   - `acceptance_gap`
   - `residue_pressure`
2. Map drift to repair packet types:
   - missing taxonomy -> taxonomy bee
   - false taxonomy -> split responsibility bee
   - stale README -> README projection regeneration
   - acceptance gap -> test/spec authoring queue
   - residue pressure -> architecture review queue
3. Require approval before mutation.
4. Re-run readiness after repair.

Acceptance gate:

- Delivery check can produce repair recommendations.
- No repair runs automatically from read-only package APIs.
- Repair results link back to delivery manifest and learning record.

### Phase 7: Promote To The Primary Release Gate

Goal: make LOC delivery readiness the official North Star check.

Tasks:

1. Add package scripts:

```json
{
  "delivery:validate": "node cli/loc-delivery.js validate",
  "delivery:check": "node cli/loc-delivery.js check",
  "delivery:verify": "node cli/loc-delivery.js verify"
}
```

2. Add `loc-story delivery` if keeping the read-only package as the main CLI.
3. Update README projection to include delivery readiness only after Phase 2 is stable.
4. Add CI-friendly output:

```json
{
  "status": "release_ready|release_blocked|review_required",
  "exitCode": 0,
  "blocking_gates": []
}
```

Acceptance gate:

```powershell
npm run story:check
npm run delivery:check -- --manifest delivery/active.manifest.json
```

## North Star Definition Of Done

LOC North Star is achieved when a release candidate can produce this evidence chain:

```text
1. User story exists and names actor, need, and value.
2. Acceptance scenarios exist and are executable or explicitly reviewed.
3. Changed implementation files link to the story and scenarios.
4. Responsibilities, actors, and roles are coherent and distinct.
5. Files belong in the filesystem and canonical architecture story.
6. README projection is current against latest evidence.
7. Residue and file economy gates pass or carry approved waivers.
8. Release readiness manifest is valid.
9. Observability signals are declared.
10. Learning record is persisted.
11. Any repair is routed through governed self-heal packets.
```

## First Concrete Milestone

The first milestone should be small:

```text
Create one delivery manifest for the honest-coherence stabilization work.
Validate that manifest.
Generate one delivery readiness report.
Fail readiness until the known coherence/test/README blockers are fixed.
```

Recommended first manifest:

```text
delivery_id: delivery-honest-coherence-stabilization
story_id: STORY-HONEST-COHERENCE-001
actor: studio_operator
need: know whether coherence scores are earned rather than copied
value: prevent false governance narratives from passing release
acceptance:
  - copied method responsibility lowers score
  - distinct method responsibility raises score
  - missing taxonomy and false taxonomy are separate states
  - story:check blocks stale README projection
implementation:
  - src/story-analysis/coherence-evaluator.js
  - src/story-analysis/coherence-aggregator.js
  - src/observability/taxonomy-scan-report.js
  - tests/verify-taxonomy-scan-report.js
```

That milestone connects the philosophical North Star to the work already in motion. It also gives the team a concrete release-readiness artifact before expanding into broader product and runtime delivery.

## Work Order

1. Finish honest coherence stabilization.
2. Add delivery manifest schema and validator.
3. Add delivery readiness report.
4. Link changed files to user story and acceptance evidence.
5. Add simple Gherkin/test result evidence.
6. Add learning records.
7. Add self-heal routing recommendations.
8. Promote delivery readiness into the release gate.

This is the path from "good code story" to "continuous delivery with narrative integrity."

The story-coherence package remains read-only and evidence-producing.
Delivery readiness may validate manifests, read test evidence, and render reports.
Mutation, self-heal dispatch, file movement, deletion, and source refactor remain outside the read-only package unless invoked through a governed workflow.
