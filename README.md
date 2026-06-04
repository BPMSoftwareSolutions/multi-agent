<!-- GENERATED:README_PROJECTION:BEGIN -->
# Multi-Agent Studio

This README is a generated architecture projection over verified taxonomy scan and codebase story-review evidence. It is not independent source truth.

```yaml
generated_from:
  source_scan: scan-2026-06-04T18-54-16-169Z
  source_story_review: codebase-story-review-2026-06-04T18-54-22-975Z
  source_truth: taxonomy_scan_plus_codebase_story_review
  do_not_hand_edit: true
  regeneration_command: npm run taxonomy:readme
  coherence_posture: local_taxonomy_clean
  canonical_posture: pass
  file_economy_posture: pass
  story_posture: earned
```

## Governance Snapshot

| Signal | Value |
| --- | --- |
| Story posture | earned |
| Overall story coherence | 100/100 earned |
| Local taxonomy tie-out | 100/100 |
| Files reviewed | 327 |
| Locally trusted files | 327 |
| Weak files | 0 |
| Missing taxonomy | 0 |
| Method anchors | 663/663 |
| Canonical residue pressure | 0 |
| File economy posture | pass |
| Small boundaries reviewed | 231 |
| Small boundaries unearned | 0 |
| Consolidation candidates | 0 |

## Architecture Story

The studio is organized around governed multi-agent work: command entry points, taxonomy scanning, coherence healing, swarm execution, observability reports, story review, and verification. Files earn their boundaries when they improve responsibility clarity, testability, agent navigation, governance protection, reuse, evidence generation, or safe swarm execution.

## Canonical Surface Map

| Surface | Canonical File | Relationship | Decision | Boundary Evidence |
| --- | --- | --- | --- | --- |
| Taxonomy scan report | `src/observability/taxonomy-scan-report.js` | canonical renderer with CLI and verification surfaces | document boundary | CLI and verification surfaces exercise scanner entry points; renderer remains canonical report owner. |
| Swarm report | `src/observability/taxonomy-swarm-report.js` | canonical sibling surface for run progress and summary reporting | document boundary | Swarm report owns taxonomy-healing batch observability; run report surfaces own generic run routing/progress views. |
| Story review report | `src/observability/codebase-story-review-report.js` | canonical only | document boundary | Obsolete story report entry points were retired; no alternate story-review surface remains. |
| Anchor healing | `bin/taxonomy-heal-run.js` | orchestration boundary distinct from direct anchor mutation utilities | document boundary | Heal-run owns governed lifecycle/reporting; taxonomy-heal and update-anchors are lower-level mutation utilities. |
| Worker reporting | `src/worker-bee/report/file-scanner.js` | worker-local reporting stack distinct from global observability | document boundary | Worker report modules own worker-local assembly/formatting/telemetry; global observability owns operator-level scan and swarm reports. |

## Residue Queue

| File | Reason | Decision |
| --- | --- | --- |
| none | No residue queue items were detected in the latest story review. | continue monitoring |

## Operator Commands

| Command | Purpose |
| --- | --- |
| `npm run taxonomy-coherence-scan -- .` | Regenerate taxonomy scan evidence and latest scan report. |
| `npm run codebase-story-review-report` | Regenerate codebase story review from latest scan and swarm evidence. |
| `npm run taxonomy:readme` | Regenerate this README projection and README staleness report. |
| `npm run test:readme-projection` | Verify README generation and staleness detection contracts. |

## README Integrity Rule

A README projection is current only when its embedded source scan and source story-review IDs match the latest verified report artifacts. If the codebase story changes, regenerate this README from verified evidence.
<!-- GENERATED:README_PROJECTION:END -->
