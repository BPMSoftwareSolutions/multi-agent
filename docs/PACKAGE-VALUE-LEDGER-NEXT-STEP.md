# Package Value Ledger Next Step

Review date: 2026-06-05

Scope:
- `C:\source\repos\bpm\internal\ai-engine\packages`
- `C:\source\repos\bpm\internal\ai-engine\docs\live-operational-cognition`
- `C:\source\repos\bpm\internal\multi-agent-studio`

Purpose:
Document the next move before package slicing, SDK promotion, demotion, quarantine, or retirement. The goal is to use the package taxonomies and Python anchors that already exist, extract them deterministically, and only then dispatch low-tier worker bees to targeted review packets.

## Executive Decision

Do not send workers through all 141 packages with open-ended reading.

The next slice should be a deterministic package taxonomy census:

1. Extract package-level tags and metadata.
2. Extract Python file and method anchors.
3. Normalize those tags into a package value ledger shape.
4. Identify mismatches, gaps, high-value clusters, and low-confidence packages.
5. Dispatch worker bees only to flagged packages or bounded package lanes.

This turns the lights on before spending AI compute.

## Initial Local Findings

The first read-only scan found these starting facts:

| Signal | Count |
| --- | ---: |
| Package directories | 141 |
| Python files under packages | 2,989 |
| Python files with `# warehouse:file` anchor | 2,989 |
| Python files with full file anchor set | 2,989 |
| Package directories with `package.json` | 99 |
| Package directories with `wpi` metadata in `package.json` | 45 |
| Package directories with `MANIFEST.md` | 46 |
| Package directories with `README.md` | 56 |
| Package directories with `contracts/` | 72 |
| Package directories with `scaffold.json` | 2 |
| Package directories with package-local scripts/checks | 49 |

Full Python file anchor set means all of these were present in the file header:

- `# warehouse:file`
- `# actor:`
- `# role:`
- `# responsibility:`
- `# source_truth:`

Important implementation note: several `package.json` files include a UTF-8 BOM. The extractor must parse JSON in a BOM-safe way.

## Current Tag Sources

The census should treat all of these as evidence inputs.

| Source | Examples | Use |
| --- | --- | --- |
| `package.json` identity | `name`, `description`, `keywords`, `private`, `scripts`, `exports`, `repository.directory` | Low-cost package identity and publish posture. |
| `package.json.wpi` | `candidate_key`, `package_family`, `posture`, `integrity_score`, `promotion_readiness`, `promoted` | Existing package taxonomy and WPI promotion signal. |
| Python file anchors | `warehouse:file`, `actor`, `role`, `responsibility`, `source_truth` | Actual code responsibility map. |
| Python method anchors | `warehouse:method`, `responsibility` near functions/classes | Method-level responsibility surface and possible value/API candidates. |
| `MANIFEST.md` | posture, commands, evidence refs, drift notes | Generated package projection and evidence hints. |
| `README.md` | generated package summary, files, commands, tables, evidence refs | Human-readable projection and usage hints. |
| `scaffold.json` | `responsibility_domain` and file lists | Migration/scaffold intent. |
| `contracts/` | contract presence and contract names | Boundary maturity signal. |
| Local docs and value proofs | OVPs, WPI, SDK grouping, trust fabric docs | Market value and evidence linkage. |

## Why This Is Efficient

The expensive path is:

```text
141 packages -> open-ended AI review -> lots of repeated reading -> unclear value ledger
```

The efficient path is:

```text
141 packages
-> deterministic census
-> normalized tag ledger
-> mismatch and value triage
-> bounded worker packets only where needed
-> package value ledger
-> SDK promotion and quarantine candidates
```

This means most workers do not need to read full source files. They receive a compact package ledger row, anchor summaries, evidence pointers, and a narrow question.

## Phase 0: Deterministic Taxonomy Census

Build a read-only extractor in `multi-agent-studio`.

Recommended files:

| File | Responsibility |
| --- | --- |
| `src/observability/package-taxonomy-census.js` | Extract package metadata, Python anchors, WPI tags, docs signals, and normalized package taxonomy rows. |
| `cli/package-taxonomy-census.js` | CLI wrapper for generating and checking census reports. |
| `tests/verify-package-taxonomy-census.js` | Determinism, read-only behavior, BOM-safe JSON parsing, and anchor extraction tests. |

Recommended npm scripts:

| Script | Command |
| --- | --- |
| `package:taxonomy-census` | Generate latest package taxonomy census reports. |
| `package:taxonomy-census:check` | Verify reports are current and deterministic. |
| `test:package-taxonomy-census` | Run focused census tests. |

Recommended outputs:

| Output | Purpose |
| --- | --- |
| `reports/package-taxonomy-census/latest.json` | Machine-readable package and anchor census. |
| `reports/PACKAGE-TAXONOMY-CENSUS-LATEST.md` | Human-readable operator report. |
| `reports/package-taxonomy-census/worker-input.json` | Compact worker-bee input, stripped of unnecessary source text. |

The extractor must be:

- read-only
- deterministic
- sorted by stable package path
- wall-clock-free unless a timestamp is read from source metadata
- BOM-safe for JSON
- tolerant of missing optional files
- explicit about parse errors and missing anchors

## Census Row Shape

Each package row should look like this:

```json
{
  "package_id": "warehouse-intelligence-sdk-core",
  "package_path": "C:\\source\\repos\\bpm\\internal\\ai-engine\\packages\\warehouse-intelligence-sdk-core",
  "package_json": {
    "name": "warehouse-intelligence-sdk-core",
    "description": "...",
    "private": true,
    "keywords": [],
    "scripts": ["check"],
    "exports": []
  },
  "wpi": {
    "candidate_key": "...",
    "package_family": "...",
    "posture": "generated boundary",
    "promotion_readiness": "promotable_with_review",
    "integrity_score": 95
  },
  "anchors": {
    "python_file_count": 8,
    "full_file_anchor_count": 8,
    "method_anchor_count": 27,
    "actors": ["infrastructure_services"],
    "roles": ["sdk_surface"],
    "source_truths": ["contract_backed_projection"],
    "responsibility_samples": [
      "Defines the structural interface for the SDK HTTP transport layer"
    ]
  },
  "supporting_surfaces": {
    "has_readme": true,
    "has_manifest": true,
    "has_contracts": true,
    "has_scaffold": false,
    "evidence_refs": []
  },
  "normalized": {
    "discovery_lane": "sdk_client",
    "candidate_domain": "sdk",
    "authority_posture": "request_or_projection_surface",
    "initial_promotion_posture": "sdk_candidate_watchlist",
    "confidence": "medium"
  },
  "triage": {
    "needs_worker_review": true,
    "worker_reason": "externally valuable SDK surface needs market-value and public/private boundary review"
  }
}
```

## Normalization Rules

Start with simple deterministic rules. Do not ask AI to interpret until these are exhausted.

| Existing signal | Normalize into |
| --- | --- |
| `package.json.wpi.posture` | implementation posture seed |
| `package.json.wpi.promotion_readiness` | starting promotion readiness |
| `package.json.wpi.package_family` | package family seed |
| `package.json.keywords` | package domain hint |
| package folder/name tokens | domain and discovery lane hint |
| Python `actor` | actor set |
| Python `role` | role set |
| Python `responsibility` | responsibility vocabulary and duplication signals |
| Python `source_truth` | confidence and authority signal |
| `MANIFEST.md` commands | runtime/check usage signal |
| `contracts/` presence | boundary maturity signal |
| docs/value-proof references | evidence contribution signal |

Initial discovery lanes:

| Lane | Selection hints |
| --- | --- |
| `sdk_client` | package name or role contains `sdk`, `client`, API wrapper, projection facade. |
| `projection_trust` | package name or responsibility contains projection, workspace, trust, control plane, request-only. |
| `inventory_wirp` | inventory, repo, architecture integrity, code intelligence, WIRP. |
| `evidence_docs` | documentation, markdown, OVP, reporting, artifact verification. |
| `worker_learning` | worker, learning loop, trust elevation, execution telemetry. |
| `governance_auth` | capability, governance, authority, authorization, contracts, policy, security. |
| `persistence` | persistence, stores, data access, SQL store. |
| `ui_demo` | UI, console, VS Code, demo, web gateway, design. |

## Phase 1: Package Value Ledger Shape

After the census exists, build the first package value ledger from the census plus selected local evidence docs.

Recommended outputs:

| Output | Purpose |
| --- | --- |
| `reports/package-value-ledger/latest.json` | Value-led package ledger. |
| `reports/PACKAGE-VALUE-LEDGER-LATEST.md` | Operator-facing package value report. |
| `reports/sdk-promotion-candidates/latest.json` | SDK promotion candidates and blockers. |
| `reports/SDK-PROMOTION-CANDIDATES-LATEST.md` | Human-readable SDK candidate report. |

Ledger fields:

| Field | Meaning |
| --- | --- |
| `package_id` | Stable package identity. |
| `current_taxonomy_tags` | Existing tags as harvested, not yet corrected. |
| `normalized_taxonomy` | Mapped tags using current governance taxonomy. |
| `user_value` | Operator/developer/enterprise value hypothesis. |
| `market_value_driver` | Investor/GTM value driver, if any. |
| `evidence_refs` | OVPs, docs, reports, contracts, tests. |
| `runtime_usage_confidence` | Evidence from scripts, imports, commands, generated refs, or tests. |
| `coherence_confidence` | Alignment of package metadata, Python anchors, docs, and contracts. |
| `maintenance_cost_signal` | File count, method count, duplicate responsibility, compatibility shim pressure. |
| `promotion_posture` | `promote_to_sdk`, `internal_capability`, `sdk_candidate_watchlist`, `demote_from_sdk_path`, `quarantine_candidate`, `retire_candidate`, `generated_disposable`, or `evidence_or_fixture_only`. |
| `worker_review_required` | Whether a low-tier worker should inspect. |
| `worker_packet_id` | Packet pointer when review is required. |

## SDK Value Mining Layer

The SDK value-mining report described in the pasted strategy is possible. It should be treated as a product-facing projection over the package value ledger, not as a replacement for the deterministic census.

The flow should be:

```text
package taxonomy census
-> package value ledger
-> SDK value mining report
-> SDK promotion candidates
-> operator review
-> implementation packet for one approved SDK boundary
```

This prevents the system from deciding that a package is SDK-ready just because it is useful internally.

## SDK Promotion Postures

Use these postures exactly so the report can make value decisions visible:

| Posture | Meaning | Action |
| --- | --- | --- |
| `promote_to_sdk` | High-value, coherent, tested, externally useful. | Package and publish after gate approval. |
| `internal_capability` | Valuable but LOC-internal. | Keep internal and document the boundary. |
| `sdk_candidate_watchlist` | Promising but needs evidence, cleanup, or sharper public API. | Continue mining. |
| `demote_from_sdk_path` | Useful but not product-grade. | Keep out of SDK packaging. |
| `quarantine_candidate` | Low value, unclear story, overlap, or drift. | Isolate and review. |
| `retire_candidate` | No clear value or replaced by stronger surface. | Remove only through governed retirement. |
| `generated_disposable` | Regenerable plumbing. | Do not promote as authored SDK. |
| `evidence_or_fixture_only` | Useful for tests, docs, or proof but not product. | Keep as support artifact. |

## SDK Mining Scores

The first scoring model should stay explainable.

Market value dimensions:

| Dimension | Question |
| --- | --- |
| `user_value` | Does this solve a real operator, developer, or enterprise problem? |
| `buyer_relevance` | Could this become a value proposition to customers, partners, or investors? |
| `reuse_potential` | Can it be used outside this repo without leaking internal authority? |
| `product_clarity` | Can it be explained in one sentence? |
| `integration_leverage` | Does it plug into broader LOC substrate workflows? |
| `differentiation` | Is this uniquely LOC, or generic utility code? |

Governed coherence dimensions:

| Dimension | Question |
| --- | --- |
| `taxonomy_coherence` | Do anchors and implementation tell the same story? |
| `filesystem_coherence` | Does the package live in the right place? |
| `readme_alignment` | Can docs be regenerated from verified story truth? |
| `acceptance_evidence` | Are tests, Gherkin, OVPs, or acceptance artifacts attached? |
| `residue_pressure` | Is there duplicate, compatibility, or legacy overlap? |
| `file_economy` | Is the boundary worth maintaining? |
| `lean_value` | Does it justify its maintenance cost? |

Suggested formula:

```text
promotable_sdk_score =
  market_value_score
+ governed_coherence_score
+ acceptance_evidence_score
+ reuse_score
- maintenance_cost
- residue_penalty
- low_visibility_risk
```

The formula should support the gate, not replace it. A package cannot be promoted without clear user value, coherent story, stable boundary, acceptance evidence, README projection, low residue, justified file economy, and maintainable public API.

## SDK Value Mining Report Shape

Recommended outputs:

| Output | Purpose |
| --- | --- |
| `reports/sdk-value-mining/latest.json` | Machine-readable SDK mining result. |
| `reports/SDK-VALUE-MINING-LATEST.md` | Human-readable SDK value mining report. |
| `reports/sdk-promotion-candidates/latest.json` | Candidate list for operator review. |
| `reports/SDK-PROMOTION-CANDIDATES-LATEST.md` | Short promotion/defer/demote report. |

Top console shape:

```text
LOC SDK VALUE MINING REPORT
Status        SDK PROMOTION REVIEW REQUIRED
Scope         141 candidate packages / capability surfaces
Promotable    <count> high-value SDK candidates
Watchlist     <count> promising but not ready
Internal      <count> internal LOC capabilities
Demote        <count> not SDK-grade
Quarantine    <count> unclear, low-value, overlap, or drift candidates
Retire        <count> removal candidates pending retirement evidence
Top Value     <top candidate names>
Main Question Which LOC capabilities deserve promotion into distributable SDK products?
```

Candidate ledger shape:

| Candidate | Value | Coherence | Evidence | Residue | Cost | Promotion posture |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `@loc/workspace-projection` | 92 | 88 | 75 | 5 | 35 | `sdk_candidate_watchlist` |
| `@loc/delivery-governance` | 90 | 90 | 80 | 10 | 25 | `sdk_candidate_watchlist` |
| `@loc/observability` | 86 | 94 | 85 | 5 | 20 | `internal_capability` |

These example names are not promotion decisions. They are placeholders for the report shape. The actual candidates must come from the census, package value ledger, and evidence refs.

## Investor-Facing SDK Families

The mining layer should map technical candidates to investor-facing value families:

| SDK family | Market value proposition |
| --- | --- |
| `@loc/story-coherence` | Prevents code, documentation, and architecture false narratives. |
| `@loc/workspace-projection` | Gives agents and contractors bounded workspaces instead of broad repo access. |
| `@loc/boundary-fabric` | Generates contract-backed integration boundaries. |
| `@loc/delivery-governance` | Links user stories, acceptance evidence, code, release, and learning. |
| `@loc/self-heal` | Routes coherence drift into governed repair workflows. |
| `@loc/observability` | Projects delivery, story, worker, and evidence data into operator-readable reports. |

Not all of these are ready. The report's job is to reveal which ones are real, which are watchlist candidates, and which are only narrative until evidence catches up.

## SDK Promotion Taxonomy

Add SDK promotion as its own taxonomy dataset instead of overloading the LOC delivery-chain taxonomy:

```text
taxonomy/loc-sdk-promotion-taxonomy.json
```

Suggested shape:

```json
{
  "schema": "loc-sdk-promotion-taxonomy.v1",
  "candidates": [
    {
      "package_id": "warehouse-intelligence-workspace-projection",
      "proposed_name": "@loc/workspace-projection",
      "source_paths": [
        "C:\\source\\repos\\bpm\\internal\\ai-engine\\packages\\warehouse-intelligence-workspace-projection"
      ],
      "user_value": "give workers bounded workspaces instead of full repository access",
      "market_value": "trust-fabric control layer for AI-assisted engineering",
      "promotion_posture": "sdk_candidate_watchlist",
      "public_api_candidates": [],
      "gates": {
        "taxonomy_coherence": "review_required",
        "filesystem_story": "review_required",
        "readme_alignment": "review_required",
        "residue_pressure": "review_required",
        "acceptance_evidence": "required",
        "lean_value": "review_required"
      },
      "risks": [],
      "decision": "needs_worker_review"
    }
  ]
}
```

This dataset should be generated from reviewed ledger rows. It should not be hand-authored as wishful product strategy.

## Continuous Delivery Tie-In

Each release or package-governance run should report:

| Delta | Meaning |
| --- | --- |
| `new_sdk_candidates_discovered` | New externally valuable surfaces surfaced by evidence. |
| `sdk_candidates_promoted` | Candidates moved to packaging implementation after gate approval. |
| `sdk_candidates_demoted` | Candidates kept internal or removed from SDK path. |
| `quarantine_candidates_opened` | Surfaces requiring isolation or narrative cleanup. |
| `retirement_candidates_closed` | Retirements completed with evidence. |
| `value_density_delta` | Value gained or maintenance burden reduced. |
| `market_value_map_updated` | Investor/GTM value map changed from new evidence. |

The cold governance rule:

```text
A package does not become an SDK because it is useful internally.
A package becomes an SDK when it has external value, coherent story, stable boundary, acceptance evidence, and low residue.
```

## Phase 2: Worker-Bee Dispatch

Only dispatch workers after the deterministic census is complete.

Worker rules:

- Low-tier workers only.
- Read-only first.
- No package moves.
- No deletes.
- No commits.
- No generated code changes.
- One packet per lane or package cluster.
- Workers receive ledger rows and selected evidence refs, not the whole repo.
- Workers must return structured findings, confidence, counterevidence, and next gate.

Recommended packet types:

| Packet | Scope | Worker question |
| --- | --- | --- |
| `PKG-TAX-SDK-01` | SDK/client packages | Which packages are truly external SDK candidates, and what blocks promotion? |
| `PKG-TAX-PERSIST-01` | Persistence packages | Which stores are domain authority, compatibility shims, or retirement/demotion candidates? |
| `PKG-TAX-PROJ-01` | Projection/trust packages | Which packages support the trust-fabric buyer story? |
| `PKG-TAX-EVID-01` | Evidence/docs packages | Which packages support OVP, DOC-FRAC, and investor evidence visibility? |
| `PKG-TAX-WORKER-01` | Worker/learning packages | Which packages prove worker-bee economics and learning loops? |
| `PKG-TAX-GOV-01` | Governance/auth packages | Which packages anchor CISO/risk and bounded authority claims? |
| `PKG-TAX-UI-01` | UI/demo packages | Which packages are demo-critical versus internal UI plumbing? |
| `PKG-TAX-UNKNOWN-01` | Mismatches and low-confidence packages | What is the minimal correction needed before value scoring? |

## Worker Packet Shape

```json
{
  "packet_id": "PKG-TAX-SDK-01",
  "mode": "read_only",
  "tier": "low",
  "objective": "Classify SDK/client package value and promotion readiness from existing census rows.",
  "read_scope": [
    "reports/package-taxonomy-census/worker-input.json",
    "selected package README and MANIFEST files",
    "selected evidence docs listed in the packet"
  ],
  "write_scope": [
    "reports/package-value-ledger/worker-findings/PKG-TAX-SDK-01.json"
  ],
  "forbidden": [
    "move packages",
    "delete files",
    "change source code",
    "rewrite package metadata",
    "invent market claims",
    "claim SDK readiness without evidence"
  ],
  "required_output": {
    "package_findings": [],
    "promotion_posture_recommendations": [],
    "evidence_gaps": [],
    "taxonomy_mismatches": [],
    "counterevidence": [],
    "next_gate": "operator_review"
  }
}
```

## Token And Compute Controls

Use the census to keep token use bounded.

| Control | Rule |
| --- | --- |
| First pass | No AI. Only deterministic extraction. |
| Worker input | Send compact JSON rows, not source trees. |
| Batch size | 10 to 20 packages per worker packet, smaller for large packages. |
| Source reading | Worker may open only files named in the packet unless it returns a reason. |
| Large packages | Summarize anchors and method counts first; only inspect representative files or flagged conflicts. |
| Evidence docs | Pass specific OVP/doc links by value driver; do not let workers search the whole docs corpus. |
| Escalation | High-tier review only for conflicting value narratives, promotion decisions, or irreversible action. |

## Gates Before Package Movement

No package movement should happen until the ledger can answer:

1. What value does this package deliver?
2. Who is the user or buyer?
3. Which actor, role, and responsibility owns it?
4. Which evidence proves it matters?
5. Is it externally promotable, internal, generated, disposable, duplicated, or risky?
6. Does runtime usage support keeping it?
7. Is there any retirement evidence?
8. What would break if it moved?
9. What report will show the value gained?
10. What learning record captures the decision?

## Recommended Next Implementation Packet

Give the next agent this packet:

```text
Objective:
Implement the deterministic package taxonomy census slice in multi-agent-studio.

Scope:
- Create a read-only extractor for C:\source\repos\bpm\internal\ai-engine\packages.
- Harvest package.json metadata, WPI tags, Python file anchors, Python method anchors, README/MANIFEST signals, scaffold.json responsibility domains, contract presence, and evidence pointers.
- Emit machine-readable and markdown reports.
- Do not move, delete, rename, or modify ai-engine packages.

Required outputs:
- reports/package-taxonomy-census/latest.json
- reports/PACKAGE-TAXONOMY-CENSUS-LATEST.md
- reports/package-taxonomy-census/worker-input.json

Required tests:
- BOM-safe package.json parsing.
- Every Python file anchor is detected.
- Missing optional files do not fail the run.
- Output is deterministic and sorted.
- Check mode fails when generated reports drift.

Acceptance:
- The report confirms package count, Python anchor coverage, WPI posture counts, source_truth rollups, actor/role rollups, method-anchor counts, and packages needing worker review.
- No package movement or source mutation occurs.
- The result is usable as worker-bee input for the package value ledger.
```

## North Star

Every package decision must be traceable:

```text
existing tags
-> normalized taxonomy
-> user value
-> market value
-> evidence
-> responsibility
-> runtime confidence
-> promotion, keep, demote, quarantine, or retire posture
-> visible report
-> learning record
```

This is how the 141-package surface becomes manageable without burning unnecessary AI compute.
