# Taxonomy-First Delivery Recovery Strategy

Date: 2026-06-05
Status: Recovery plan after implementation-first delivery-readiness work

## Executive Summary

The delivery-readiness slice moved too quickly into executable implementation. That created exactly the failure mode the LOC governance system is supposed to prevent: code existed before its story, taxonomy boundary, actor responsibility, and value trace were clear.

The recovery move is to stop adding readiness code and return to the original successful pattern:

```text
canonical data first
  -> taxonomy projection
  -> deterministic review packet
  -> anchors and ownership
  -> only then implementation
```

Delivery readiness should not begin as `src/delivery/*.js`. It should begin as a canonical taxonomy dataset that names the value chain, actors, stories, responsibilities, evidence types, and allowed gate semantics. Code should be generated or implemented against that model after the model can explain itself.

## Problem With The Current Direction

The current delivery implementation has useful pieces, but the approach is inverted.

| Symptom | Why It Matters |
| --- | --- |
| Delivery modules were added before a delivery taxonomy existed | New code cannot prove why it belongs or what boundary it owns. |
| Manifests became validation inputs instead of canonical source truth | The validator started defining the model implicitly. |
| Release gate semantics were added in code before being settled as data | `required`, `waived`, and `review_required` became implementation debate instead of contract design. |
| New files lack explicit story/value anchors beyond generic file taxonomy | The code does not yet show how it connects to user value, actor, story, and LOC chain. |
| Tests chased exploit cases after implementation | The system became reactive instead of deterministic. |

The uncomfortable truth: a gate can be technically correct and still not be coherent if its responsibilities were not declared first.

## North Star

The LOC delivery system should answer, deterministically:

1. What user value is this delivery protecting?
2. Which actor receives that value?
3. Which user story expresses the need?
4. Which acceptance scenarios prove the value?
5. Which code boundaries are allowed to exist for this delivery?
6. Which file and method anchors prove each boundary?
7. Which evidence artifacts prove the acceptance scenarios?
8. Which governance gates are blocking, waived, or review-only?
9. Which learning record prevents future regression?

If the taxonomy cannot answer those questions from data, implementation should not proceed.

## Revised Operating Principle

The taxonomy drives implementation. Implementation does not invent taxonomy.

That means:

- No new delivery module without a canonical taxonomy row first.
- No validator rule without a contract field first.
- No release gate state without a declared semantic meaning first.
- No readiness status without deterministic derivation from data.
- No code acceptance without file and method anchors tied to the story/value chain.

## Canonical Data Model First

Create a canonical delivery taxonomy dataset before adding or reshaping code:

```text
taxonomy/loc-delivery-chain.json
```

Suggested schema:

```json
{
  "schema": "loc-delivery-chain-taxonomy.v1",
  "stories": [
    {
      "story_id": "STORY-HONEST-COHERENCE-001",
      "actor": "studio_operator",
      "need": "know whether coherence scores are earned rather than copied",
      "value": "prevent false governance narratives from passing release",
      "source": "docs/claude-thread-2.txt"
    }
  ],
  "acceptance_scenarios": [
    {
      "scenario_id": "SCN-HC-001",
      "story_id": "STORY-HONEST-COHERENCE-001",
      "responsibility": "prove copied method responsibility lowers coherence",
      "evidence_contract": "executed_test_or_structured_artifact"
    }
  ],
  "delivery_boundaries": [
    {
      "boundary_id": "delivery_manifest_contract",
      "story_id": "STORY-HONEST-COHERENCE-001",
      "canonical_path": "contracts/loc-delivery-manifest.schema.json",
      "actor": "delivery_contract_consumer",
      "role": "contract",
      "responsibility": "define the canonical delivery manifest shape and allowed gate states",
      "allowed_methods": []
    }
  ],
  "gate_semantics": [
    {
      "gate": "acceptance",
      "allowed_states": ["required", "waived", "review_required"],
      "release_effect": {
        "required": "must_pass",
        "waived": "blocks_unless_valid_waiver_present",
        "review_required": "cannot_release_without_human_decision"
      }
    }
  ]
}
```

This dataset should become the source of truth for schemas, fixtures, implementation anchors, and tests.

## Taxonomy Projection Before Code

After the canonical dataset exists, generate projections from it:

| Projection | Output | Purpose |
| --- | --- | --- |
| Contract projection | `contracts/loc-delivery-manifest.schema.json` | JSON schema mirrors taxonomy gate states and required story links. |
| Fixture projection | `tests/fixtures/delivery/*.manifest.json` | Test manifests are examples of the canonical value chain. |
| Anchor projection | planned file/method taxonomy rows | Every new file has a declared responsibility before it exists. |
| Agent packet | `reports/loc-delivery-taxonomy/latest/agent-packet.json` | Other agents receive deterministic work, not chat memory. |
| Markdown projection | `reports/LOC-DELIVERY-TAXONOMY.md` | Human-readable value chain review. |

Implementation begins only after these projections are reviewed.

## Worker-Bee Execution Model

Taxonomy-first does not mean manual or slow. Large taxonomy changes should use the worker-bee packet flow.

The worker bees are the correct execution mechanism when the work touches many files, requires broad scanning, or needs repetitive anchor repair. The coordinator should not hand-edit a large set of files from chat context. The coordinator should generate deterministic packets from the taxonomy dataset and let workers execute those packets under scan and ledger gates.

The flow is:

```text
canonical taxonomy dataset
  -> projection identifies missing or weak anchors
  -> packet builder groups bounded work
  -> worker bees apply file/method taxonomy work
  -> scan verifies anchor quality
  -> ledger records before/after evidence
  -> reviewer approves or rejects packet
```

Worker-bee work must be packetized by boundary, not by convenience. A packet should have:

```json
{
  "schema": "loc-delivery-taxonomy-worker-packet.v1",
  "packet_id": "loc-delivery-taxonomy-packet-001",
  "source_truth": "taxonomy/loc-delivery-chain.json",
  "scope": "delivery-readiness-boundaries",
  "mode": "taxonomy_anchor_repair",
  "layer": "both",
  "targets": [
    {
      "path": "src/delivery/manifest-validator.js",
      "boundary_id": "delivery_manifest_validator",
      "story_links": ["STORY-HONEST-COHERENCE-001"],
      "acceptance_links": ["SCN-HC-001"],
      "expected_file_anchor": {
        "actor": "delivery_contract_consumer",
        "role": "validator",
        "responsibility": "validate delivery manifest instances against the canonical LOC delivery taxonomy contract",
        "source_truth": "taxonomy/loc-delivery-chain.json"
      }
    }
  ],
  "gates": {
    "max_files": 10,
    "requires_before_after_scan": true,
    "requires_no_missing_anchors": true,
    "requires_story_links": true
  }
}
```

Use worker bees for:

- bulk file-anchor repair
- bulk method-anchor repair
- scan-and-classify passes across many files
- repetitive taxonomy normalization
- generating before/after packet evidence

Do not use worker bees for:

- inventing the canonical delivery taxonomy
- deciding gate semantics
- approving waivers
- making architecture decisions without a packet
- broad implementation refactors before the taxonomy declares boundaries

The worker should never infer work from a chat transcript. It consumes packets generated from canonical taxonomy.

## Required Boundary Decisions

Before more code, decide the canonical ownership map:

| Boundary | Candidate Path | Responsibility |
| --- | --- | --- |
| Delivery taxonomy source | `taxonomy/loc-delivery-chain.json` | Canonical value/story/actor/gate data. |
| Manifest contract | `contracts/loc-delivery-manifest.schema.json` | Machine-readable manifest shape derived from taxonomy. |
| Delivery projection/report | `src/observability/delivery-readiness-report.js` | Read-only report rendering from computed readiness data. |
| Delivery orchestration | `src/delivery/release-readiness.js` | Reads taxonomy, manifest, story evidence, and emits readiness. |
| CLI wrapper | `cli/loc-delivery.js` | Thin operator entrypoint only. |
| Tests | `tests/verify-*-delivery*.js` | Contract and exploit protection. |

If a file does not fit one of these boundaries, it should not be created yet.

## Gate Semantics Must Be Data

The gate policy debate should be settled in taxonomy, not code.

| Gate Policy | Meaning | Release Effect |
| --- | --- | --- |
| `required` | Gate must pass from evidence. | Blocks release until pass. |
| `review_required` | Evidence is insufficient or requires human governance. | Blocks automated release; status should be `review_required`, not `release_ready`. |
| `waived` | Governance authority accepts temporary risk. | Blocks unless waiver has authority, reason, expiration, and follow-up. |

No implementation should treat these as arbitrary strings.

## Recovery Phases

### Phase 0: Stop Implementation Drift

Do not add new delivery readiness behavior until the taxonomy source is in place.

Immediate actions:

- Mark the existing `src/delivery/*` and `src/observability/delivery-readiness-report.js` as provisional.
- Do not wire `delivery:check` into CI yet.
- Keep current tests as safety evidence, but do not treat them as governance completeness.

Exit gate:

- Team agrees the next artifact is canonical taxonomy data, not more readiness code.

### Phase 1: Define The LOC Delivery Taxonomy

Create `taxonomy/loc-delivery-chain.json` with:

- stories
- actors
- value statements
- acceptance scenarios
- delivery boundaries
- gate semantics
- evidence artifact types
- waiver semantics
- learning-record semantics

Exit gate:

- The taxonomy can explain why every proposed delivery file exists.

### Phase 2: Generate A Read-Only Delivery Taxonomy Projection

Add a read-only projection command only after the dataset exists.

Suggested command:

```text
npm run delivery:taxonomy
```

Outputs:

```text
reports/loc-delivery-taxonomy/latest/taxonomy.json
reports/loc-delivery-taxonomy/latest/agent-packet.json
reports/LOC-DELIVERY-TAXONOMY.md
```

Exit gate:

- The projection is deterministic.
- It mutates only report artifacts.
- It identifies missing anchors before implementation starts.

### Phase 2B: Packetize Worker-Bee Taxonomy Work

If the projection identifies more than a small handful of files, create worker-bee packets instead of manual edits.

Suggested outputs:

```text
reports/loc-delivery-taxonomy/latest/worker-packets/packet-001.json
reports/loc-delivery-taxonomy/latest/worker-packets/packet-002.json
reports/loc-delivery-taxonomy/latest/worker-ledger.json
```

Packet rules:

- Keep packets small enough to review, usually 5-10 files.
- Group files by boundary or responsibility family.
- Include expected file anchors and method-anchor intent.
- Include story and acceptance links for every target.
- Require before/after scan evidence.
- Stop the packet if new missing anchors appear or local taxonomy regresses.

Exit gate:

- Bulk taxonomy work is represented as packets.
- Worker output can be reviewed from ledger evidence.
- No large taxonomy sweep depends on chat memory.

### Phase 3: Anchor The Planned Implementation

Before changing code, create an implementation anchor plan:

```json
{
  "path": "src/delivery/manifest-validator.js",
  "file_anchor": {
    "responsibility": "validate delivery manifest instances against the canonical LOC delivery taxonomy contract",
    "actor": "delivery_contract_consumer",
    "role": "validator",
    "source_truth": "taxonomy/loc-delivery-chain.json"
  },
  "method_anchors": [
    {
      "name": "validateDeliveryManifest",
      "responsibility": "return deterministic manifest validity errors from canonical delivery taxonomy rules"
    }
  ],
  "story_links": ["STORY-HONEST-COHERENCE-001"],
  "acceptance_links": ["SCN-HC-001"]
}
```

Exit gate:

- Every proposed file has a boundary, actor, role, story link, and acceptance link.

### Phase 4: Implement Only Against Approved Anchors

Now implementation can proceed, but only file by file:

1. Pick one approved boundary.
2. Add or revise the file.
3. Add file and method anchors.
4. Run taxonomy scan.
5. Run story check.
6. Run the delivery-specific test.
7. Confirm no new unanchored code exists.

Exit gate:

- The file’s local taxonomy ties out.
- The story/value chain remains visible.
- The delivery test proves the acceptance scenario.

### Phase 5: Promote To Delivery Gate

Only after the taxonomy, projection, anchors, and implementation agree:

- wire `delivery:check` into standard verification
- document the workflow in README
- allow other agents to use the implementation packet

Exit gate:

- A new agent can start from the taxonomy packet and understand what to do without chat context.

## Immediate Instruction To The Other Agent

Use this packet instead of continuing implementation-first work:

```text
Stop adding delivery readiness code.

Create the canonical LOC delivery taxonomy dataset first.

The dataset must define stories, actors, value, acceptance scenarios, delivery boundaries, gate semantics, evidence artifact types, waiver semantics, and learning-record semantics.

Then generate a read-only taxonomy projection and an agent packet.

Only after the taxonomy projection explains every proposed file should implementation continue.
```

## Definition Of Ready For Implementation

Implementation may resume only when all are true:

- `taxonomy/loc-delivery-chain.json` exists.
- The taxonomy names the delivery boundaries before files are added.
- Gate semantics are declared as data.
- Every planned file has a file anchor and story link.
- Every planned method has a method anchor or is explicitly not needed.
- Acceptance scenarios link to evidence contracts.
- The agent packet can be consumed without chat context.

## Definition Of Done

This recovery is done when delivery readiness is no longer a pile of validators and reports. It is a deterministic projection from canonical taxonomy:

```text
value
  -> actor
  -> story
  -> acceptance
  -> boundary
  -> anchor
  -> evidence
  -> gate decision
  -> learning
```

That is the North Star. Code comes after that chain is visible.
