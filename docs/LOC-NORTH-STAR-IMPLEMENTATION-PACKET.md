# LOC North Star Implementation Packet

## Objective

Implement the first concrete slice of LOC North Star delivery readiness:

```text
user value
-> user story
-> acceptance evidence
-> implementation trace
-> responsibility / actor / role
-> coherence evidence
-> release readiness decision
```

This packet is for the next implementation agent. The goal is not to complete the whole North Star in one pass. The goal is to create the first governed delivery-readiness substrate that can fail honestly and later become the release gate.

## Required Reading

Read these before editing:

- `docs/LOC-NORTH-STAR-IMPLEMENTATION-STRATEGY.md`
- `docs/SPLIT-RESPONSIBILITY-IMPLEMENTATION-STRATEGY.md`
- `docs/canonical LOC delivery chain.md`
- `packages/story-coherence/README.md`
- `packages/story-coherence/src/index.js`
- `src/observability/codebase-story-review-report.js`
- `src/observability/taxonomy-scan-report.js`
- `src/core/stages-modules/stage-schemas.js`

## Current Repo State To Respect

There are existing uncommitted changes from coherence work. Do not revert them.

Known current worktree changes include:

- `src/taxonomy/file-header-extractor.js`
- `src/story-analysis/coherence-evaluator.js`
- `cli/fractal-taxonomy-scanner.js`
- `tests/verify-evidence-bundle.js`
- `tests/verify-story-coherence-package.js`
- generated story review reports
- new strategy docs under `docs/`

The current story gate is not clean. That is expected. The delivery readiness work should report blockers honestly, not paper over them.

Known blockers from review:

- `story:check` reports `story_review_required`.
- README projection is stale against latest scan/story-review IDs.
- `test:taxonomy-scan-report` fails because missing taxonomy and present-but-false taxonomy are conflated.
- Honest coherence is still split between `coherence-evaluator.js` and old similarity-based `coherence-analyzer.js`.

## Implementation Scope

Build Phase 1 and the smallest useful part of Phase 2 from the North Star strategy.

### In Scope

1. Add a delivery manifest contract.
2. Add manifest validation.
3. Add a CLI to validate a manifest.
4. Add a delivery readiness report that combines:
   - manifest intent,
   - acceptance evidence declarations,
   - implementation trace,
   - current `story:check`-style gates when available.
5. Add tests around the manifest validator and readiness report.
6. Add one fixture manifest for honest-coherence stabilization.

### Out Of Scope For This Packet

- Do not implement worker-bee mutation.
- Do not run or dispatch self-heal automatically.
- Do not fix all coherence-test failures unless they are directly needed by this packet.
- Do not regenerate all production responsibilities by hand.
- Do not claim release readiness is earned while current story gates fail.

## Recommended Files To Add

```text
contracts/loc-delivery-manifest.schema.json
src/delivery/manifest-validator.js
src/delivery/manifest-loader.js
src/delivery/release-readiness.js
src/observability/delivery-readiness-report.js
cli/loc-delivery.js
tests/fixtures/delivery/honest-coherence.manifest.json
tests/fixtures/delivery/invalid-missing-story.manifest.json
tests/fixtures/delivery/invalid-missing-acceptance.manifest.json
tests/verify-loc-delivery-manifest.js
tests/verify-delivery-readiness-report.js
```

Optional package script additions:

```json
{
  "delivery:validate": "node cli/loc-delivery.js validate",
  "delivery:check": "node cli/loc-delivery.js check",
  "test:delivery-manifest": "node tests/verify-loc-delivery-manifest.js",
  "test:delivery-readiness": "node tests/verify-delivery-readiness-report.js"
}
```

## Manifest Contract

Create `loc-delivery-manifest.v1`.

Minimum required fields:

```json
{
  "schema": "loc-delivery-manifest.v1",
  "delivery_id": "delivery-honest-coherence-stabilization",
  "intent": {
    "type": "user_story",
    "story_id": "STORY-HONEST-COHERENCE-001",
    "actor": "studio_operator",
    "need": "know whether coherence scores are earned rather than copied",
    "value": "prevent false governance narratives from passing release",
    "source": "docs/claude-thread-2.txt"
  },
  "acceptance": {
    "scenarios": [
      {
        "id": "SCN-HC-001",
        "name": "copied method responsibility lowers coherence",
        "test_command": "npm run test:evidence",
        "expected_result": "pass"
      }
    ]
  },
  "implementation": {
    "changed_files": [
      {
        "path": "src/story-analysis/coherence-evaluator.js",
        "reason": "replace similarity scoring with responsibility integrity scoring",
        "value_link": "STORY-HONEST-COHERENCE-001",
        "acceptance_links": ["SCN-HC-001"]
      }
    ]
  },
  "coherence_sources": {
    "taxonomy_scan": "reports/scan-report-latest.json",
    "story_review": "reports/codebase-story-review-latest.json",
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
    "record_path": "reports/delivery-learning/delivery-honest-coherence-stabilization.json",
    "future_regressions": [
      "method responsibility copied from file responsibility must not earn 100"
    ]
  }
}
```

Validator requirements:

- `schema` must equal `loc-delivery-manifest.v1`.
- `delivery_id` is required.
- `intent.story_id`, `intent.actor`, `intent.need`, and `intent.value` are required.
- At least one acceptance scenario is required.
- Each scenario must have `id`, `name`, and either `test_command` or `evidence`.
- At least one changed file is required.
- Each changed file must have `path`, `reason`, `value_link`, and at least one `acceptance_links` entry.
- Each `value_link` must match `intent.story_id`.
- Each `acceptance_links` entry must reference a declared scenario id.
- `release_gates` must include all required gate names.
- If any gate is waived later, require authority, reason, expiration, and follow-up. Waivers can be defined but do not need full implementation in the first pass.

## CLI Behavior

Add `cli/loc-delivery.js`.

Required commands:

```powershell
node cli/loc-delivery.js validate --manifest tests/fixtures/delivery/honest-coherence.manifest.json
node cli/loc-delivery.js check --manifest tests/fixtures/delivery/honest-coherence.manifest.json
```

`validate`:

- Loads manifest.
- Runs validator.
- Prints concise status.
- Exits `0` when valid.
- Exits `1` when invalid.

`check`:

- Runs manifest validation first.
- Reads current story evidence if available:
  - `reports/scan-report-latest.json`
  - `reports/codebase-story-review-latest.json`
  - `README.md`
- Produces a readiness object.
- Writes:

```text
reports/delivery-readiness/<delivery_id>/readiness.json
reports/delivery-readiness/<delivery_id>/readiness.md
reports/delivery-readiness/latest.json
reports/DELIVERY-READINESS-LATEST.md
```

- Exits `0` only when all required gates pass.
- Exits `1` when readiness is blocked or review is required.

Do not make `check` run tests yet. For this packet, acceptance scenarios can be declared and reported as `declared_not_executed` unless an evidence file is provided.

## Readiness Report Shape

Minimum JSON shape:

```json
{
  "schema": "loc-delivery-readiness-report.v1",
  "delivery_id": "delivery-honest-coherence-stabilization",
  "generated_at": "ISO-8601",
  "status": "release_blocked",
  "intent": {
    "story_id": "STORY-HONEST-COHERENCE-001",
    "actor": "studio_operator",
    "need": "...",
    "value": "..."
  },
  "acceptance": {
    "status": "declared_not_executed",
    "scenario_count": 3,
    "scenarios": []
  },
  "implementation_trace": {
    "status": "pass",
    "changed_files": []
  },
  "coherence": {
    "local_taxonomy": "pass|review_required|unknown",
    "filesystem_story": "pass|review_required|unknown",
    "readme_alignment": "pass|review_required|unknown",
    "canonical_residue": "pass|review_required|unknown",
    "file_economy": "pass|review_required|unknown"
  },
  "blocking_gates": [],
  "learning": {
    "status": "pass|review_required",
    "record_path": "..."
  }
}
```

Markdown report should include:

- Delivery summary
- User story/value
- Acceptance scenarios
- Implementation trace
- Coherence gate table
- Blocking gates
- Learning record
- Release decision

## Test Requirements

Add tests that can run without network or external services.

`tests/verify-loc-delivery-manifest.js` should assert:

- Valid fixture passes.
- Missing story id fails.
- Missing value fails.
- Missing acceptance scenarios fails.
- Changed file with unknown scenario link fails.
- Changed file with value link not matching story id fails.

`tests/verify-delivery-readiness-report.js` should assert:

- Valid manifest builds report.
- Report status is blocked/review-required when evidence is missing or current story gates fail.
- Report includes intent, acceptance, implementation trace, coherence, and learning sections.
- Report files are written under `reports/delivery-readiness/...`.

## Acceptance Commands

Run at minimum:

```powershell
npm run test:delivery-manifest
npm run test:delivery-readiness
node cli/loc-delivery.js validate --manifest tests/fixtures/delivery/honest-coherence.manifest.json
node cli/loc-delivery.js check --manifest tests/fixtures/delivery/honest-coherence.manifest.json
```

Also run these to understand current integration posture, but do not force them green as part of this packet unless scoped:

```powershell
npm run story:check
npm run test:story-coherence-package
npm run test:codebase-story-review-report
npm run test:taxonomy-scan-report
```

Expected current posture:

- `story:check` may fail until coherence/README blockers are resolved.
- `test:taxonomy-scan-report` may fail until missing-vs-false taxonomy is fixed.

The delivery readiness report should surface these as blockers.

## Guardrails

- Keep this read-only except for writing delivery-readiness report artifacts.
- Do not mutate source anchors.
- Do not run worker-bee repair.
- Do not hand-edit mass responsibilities.
- Do not make README claim readiness unless delivery readiness actually passes.
- Use deterministic validation first; no model calls for this packet.
- Preserve existing uncommitted user/agent work.

## Handoff Output

When done, report:

- Files added/changed.
- Commands run and results.
- Whether delivery readiness is `release_ready`, `release_blocked`, or `review_required`.
- Which gates are blocking.
- Any intentionally deferred North Star phases.

## Definition Of Done

This packet is complete when:

- A valid LOC delivery manifest fixture exists.
- Invalid manifest fixtures fail for clear reasons.
- `loc-delivery validate` works.
- `loc-delivery check` writes JSON and Markdown readiness reports.
- Current coherence/story blockers appear as release blockers, not hidden failures.
- New tests for manifest validation and readiness reporting pass.
