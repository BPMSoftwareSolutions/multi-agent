# Fractal Self-Taxonomy Implementation Strategy

Date: 2026-06-04
Status: Continuation strategy after Claude thread rate limit
Baseline source: Fresh local run of `node bin/extract-taxonomy.js`, `node bin/analyze-story.js`, and `node bin/generate-story-report.js`

## Executive Summary

The Claude thread exposed the right product idea and the wrong execution pattern.

The right idea is that the smallest trusted unit is a fractal: a file that can state its own purpose, prove that purpose through its methods, receive a coherence verdict, and repair itself or split when the proof does not match the claim. Once that loop works for one JavaScript file category, the same loop can scale across every file in that category.

The wrong pattern was launching broad refactoring batches without a manifest, a live ledger, or a per-file score gate. That led to confusion over whether a batch was running, whether "100 weak files" was real, and whether newly split files were actually more coherent.

Going forward: no swarm work runs without a manifest, no manifest runs without a live ledger, and no new module is accepted unless it self-scores 100/100 immediately.

## Current Local Baseline

Fresh local taxonomy extraction produced:

| Metric | Value |
| --- | ---: |
| JavaScript files with taxonomy | 274/274 |
| Methods with taxonomy | 284/284 |
| Overall coherence | 71/100 |
| Strong files, score >= 70 | 170/274 |
| Files under 70 | 104/274 |
| Weak files, score < 50 | 78/274 |
| Zero-score files | 23/274 |

The lowest-score files are not random. They mostly fall into a few clear buckets:

| Pattern | Local Count | Meaning |
| --- | ---: | --- |
| `Provides X, Y functionality` file anchors | 23 | Stale/generated anchors, often zero overlap with method evidence |
| Files with no methods | 65 | Currently score as 100, which inflates health and should be marked `unproven` instead |
| CLI/orchestrator wording mismatch | 47 | Often a vocabulary alignment problem or too-broad entrypoint claim |
| Writer/renderer mixed modules | 7 | Real split candidates, for example `bin/analysis-formatter.js` |

Important example from the thread: `bin/analysis-formatter.js` is not a mysterious scoring bug. It mixes persistence (`writeAnalysisReport`) with console rendering (`displayWeakStories`, `displayStrongStories`, `displayAnalysisReport`). A true split should produce `analysis-report-writer.js` and `analysis-console-renderer.js`, each with anchors that match its methods.

## Fractal Definition

A code fractal has four parts:

1. Claim: the `warehouse:file` responsibility.
2. Evidence: every `warehouse:method` responsibility.
3. Verdict: a deterministic coherence score and issue list.
4. Repair: an approved action, such as re-anchor, split, delegate, or mark unproven.

The loop is:

```text
extract taxonomy
  -> evaluate file claim against method evidence
  -> classify repair type
  -> apply approved repair
  -> re-extract taxonomy
  -> verify score moved up and did not regress neighbors
```

That is the self-taxonomy. Self-healing is simply the same loop allowed to write changes under strict gates.

## Non-Negotiable Rules

1. Every new module created by refactoring must score 100/100 on the same run.
2. No file may keep a `Provides X, Y functionality` anchor.
3. No batch may start without a manifest that lists every target file, baseline score, intended action, and assigned agent.
4. No batch may run without a live ledger that shows batch size, current packet, last completed file, completed count, errors, and before/after score.
5. `CURRENT-RUN.md` must be generated from ledger state. It must not be hand-authored.
6. A file with zero methods is not "proven coherent"; it is `unproven` unless it is an explicit delegator or data-only module.
7. If overall coherence goes down, the swarm stops and the reviewer diagnoses the regression before more writes.

## Target Architecture

### 1. Coherence Manifest Builder

Add a manifest generator that reads `reports/story-analysis.json` and writes a run definition:

```text
reports/coherence-runs/<run_id>/manifest.json
```

Manifest fields:

```json
{
  "schema": "coherence-refactor-run.v1",
  "run_id": "2026-06-04T...",
  "state": "running",
  "baseline": {
    "overall": 71,
    "total_files": 274,
    "under_70": 104,
    "weak_under_50": 78
  },
  "targets": [
    {
      "path": "bin/analysis-formatter.js",
      "score_before": 24,
      "diagnosis": "split_required",
      "planned_action": "split_writer_from_console_renderer",
      "assigned_agent": "coherence-refactorer-01"
    }
  ]
}
```

### 2. Per-Agent Part Files

Reuse the worker-bee ledger pattern. Agents never write to a shared status file. Each agent writes immutable part files:

```text
reports/coherence-runs/<run_id>/part-p1-0001.json
```

Part fields:

```json
{
  "agent": "coherence-refactorer-01",
  "packet_index": 1,
  "status": "done",
  "current_file": null,
  "last_completed": "bin/analysis-formatter.js",
  "results": [
    {
      "path": "bin/analysis-formatter.js",
      "action": "split_required",
      "score_before": 24,
      "score_after": 100,
      "modules_created": [
        "bin/analysis-report-writer.js",
        "bin/analysis-console-renderer.js"
      ],
      "tests": ["node bin/analyze-story.js"],
      "status": "approved"
    }
  ]
}
```

### 3. Status Combiner

Add a combiner that reads manifest plus parts and generates:

```text
reports/coherence-runs/<run_id>/status.json
reports/coherence-status-latest.json
reports/CURRENT-RUN.md
```

`CURRENT-RUN.md` should answer, at a glance:

- What run is active?
- How many files are in the batch?
- How many are complete?
- What packet or file is active?
- What file completed last?
- Did score go up or down?
- What errors are blocking the run?
- What is the next target?

### 4. Agent Roles

Use several agents, but make their contracts narrow:

| Role | Writes Code? | Responsibility |
| --- | --- | --- |
| Auditor | No | Classifies each weak file as anchor-only, split-required, delegator, scorer-defect, or duplicate-family |
| Refactorer | Yes | Applies one approved action at a time from the manifest |
| Reviewer | No, except fixups | Runs extraction/analyzer, validates scores, checks exports/imports, approves or rejects |
| Ledger Combiner | No | Maintains live status from manifest and part files |
| Coordinator | No direct refactors | Slices packets, starts agents, stops the run on regression |

The worker should never infer work from a chat transcript. It consumes the manifest.

## Repair Taxonomy

Each target file gets exactly one primary repair classification:

| Classification | Use When | Action |
| --- | --- | --- |
| `anchor_only` | Methods are one coherent concern, but file/method words drift | Rewrite anchors only |
| `split_required` | File combines multiple real concerns | Split into focused modules and update imports |
| `delegator` | File only routes or re-exports focused modules | Use a delegator anchor and avoid method sprawl |
| `unproven` | File has no methods or only constants | Do not count as 100 unless explicitly data-only |
| `scorer_defect` | Human review shows code is coherent but scoring misses synonyms | Improve scorer vocabulary or scoring model |
| `duplicate_family` | Parallel old/new modules both exist | Consolidate or mark legacy aggregator intentionally |

This keeps the swarm from treating every weak score as "split everything."

## Execution Waves

### Wave 0: Freeze Truth

Goal: establish trustworthy measurement before more refactoring.

Steps:

1. Run `node bin/extract-taxonomy.js`.
2. Run `node bin/analyze-story.js`.
3. Run `node bin/generate-story-report.js`.
4. Store baseline in a coherence run manifest.
5. Add an `unproven` bucket for zero-method files so they stop inflating the score.

Exit gate:

- Baseline numbers are reproducible.
- `CURRENT-RUN.md` is generated from run state.

### Wave 1: Make The Taxonomy Engine Self-Coherent

Goal: the system must classify itself cleanly before it classifies the warehouse.

Targets:

- `bin/analyze-story.js`
- `bin/analysis-formatter.js`
- `bin/story-analyzer.js`
- `src/story-analysis/*`
- `src/taxonomy/*`

Priority fixes:

- Split writer and renderer modules.
- Remove `Provides X, Y functionality` anchors.
- Decide whether `similarity-engine.js` is legacy and should be deleted, delegated, or fully re-anchored.
- Make scorer/reporting distinguish strong, weak, and unproven.

Exit gate:

- Every touched/new module scores 100/100.
- Overall score increases or remains stable after excluding unproven modules from "strong."

### Wave 2: Productize Coherence Run Observability

Goal: make swarm progress visible and auditable.

Build:

- `bin/coherence-manifest.js`
- `bin/coherence-status.js`
- `bin/current-run-summary.js` backed by coherence status
- `src/coherence-ledger/*` mirroring the worker-bee ledger pattern

Exit gate:

- A run shows batch size, current file, last completed file, score delta, packet count, and errors while work is in flight.
- No direct hand-editing of `reports/CURRENT-RUN.md`.

### Wave 3: Swarm By Package Cluster

Goal: run 5-10 agents safely without losing visibility.

Suggested agent packets:

| Packet | Scope |
| --- | --- |
| A | `bin/*` CLI/reporting/progress tools |
| B | `src/story-analysis/*` and `src/taxonomy/*` |
| C | `src/core/prompts/*` and `src/core/round-modules/*` |
| D | `src/cli/commands/*` and `src/cli/renderers/*` |
| E | `src/worker-bee/anchor-scanner/*` |
| F | `src/worker-bee/file-swarm/*` and `src/worker-bee/file-swarms/*` |
| G | `src/worker-bee/ledger/*`, `monitor/*`, `packet-modules/*` |
| H | `src/shared/sql-modules/*` and `src/shared/actions-modules/*` |
| I | `src/audit/*`, `src/scanner/*`, `src/progress/*` |

Each packet gets a maximum of 10-15 files. Each result must include before/after score and files created/modified.

Exit gate:

- No target file regresses.
- Every new file scores 100/100.
- Overall coherence rises monotonically.
- Imports and public CLI entrypoints still work.

### Wave 4: Generalize To File Categories

Goal: turn the self-taxonomy into a reusable category taxonomy engine.

Once the JavaScript file fractal is stable, define category profiles:

| Category | Evidence To Extract | Repair Actions |
| --- | --- | --- |
| JavaScript source | file anchors, method anchors, exports/imports | re-anchor, split, delegate |
| CLI entrypoint | command parse, route, render, side effects | delegate, isolate parser/renderer |
| Report generator | load, compute, render, persist | split writer/renderer/calculator |
| Worker swarm | manifest, packet, agent loop, ledger | isolate orchestration from packet processing |
| Python source | file/method anchors from worker-bee | use existing worker-bee flow |

This is where the fractal scales: the same claim/evidence/verdict/repair loop applies to any file type once a category profile teaches the extractor what evidence matters.

## Quality Gates

Run after every packet:

```bash
node bin/extract-taxonomy.js
node bin/analyze-story.js
node bin/generate-story-report.js
```

Additional gates:

- Require all changed entrypoints with `require()` smoke checks.
- For CLI files, run representative `--help` or dry-run commands where available.
- Check `git diff --stat` after every packet; broad churn means stop and review.
- Reject files whose score improves only by stuffing method words into a giant file responsibility. The story must be true, not gamed.

## Immediate Next Implementation Tasks

1. Add the coherence run ledger and manifest builder.
2. Update scoring/reporting so zero-method files are `unproven`, not free 100s.
3. Use `bin/analysis-formatter.js` as the canary split.
4. Generate `CURRENT-RUN.md` from the coherence ledger.
5. Start the swarm only after the manifest and current-run report are visible.

## Definition Of Done

The continuation is done when:

- The taxonomy engine can evaluate its own files without stale `Provides X, Y` anchors.
- Every new module produced by refactoring self-scores 100/100.
- A live run report shows batch size, current file, last completed file, and score deltas.
- Overall coherence moves upward monotonically from the 71/100 local baseline.
- The same manifest/ledger/evaluation loop can be applied to another JavaScript file category without changing the orchestration model.
