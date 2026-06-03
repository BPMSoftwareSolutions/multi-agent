# Worker-Bee: Taxonomy-Anchor Swarm

A thin, **isolated** process that adds `# warehouse:file` taxonomy anchors to a
Python codebase by fanning packets of files out to a swarm of Gemini agents.

It is intentionally **not** wired into the ai-engine substrate, learning loop, or
SQL governance. It reuses two things from ai-engine as plain references:

- the anchor schema (`contracts/anchor_contract.json`)
- the authoritative gate (`taxonomy_comment_scanner.py`)

Nothing here writes to the substrate. The python scanner stays the source of truth.

## What it does

```
scan target repo for *.py missing a # warehouse:file anchor
  → chunk into packets (a few files each)
  → run N agents concurrently, each pulling packets from a shared queue
  → each agent classifies its files with Gemini (actor / role / responsibility /
    source_truth / mutation_policy / generated)
  → code computes the deterministic fields (expected_location, repo_root_depth)
    and writes the anchor block atop each file (idempotent)
  → report coverage delta
```

`role` uses a controlled vocabulary (`business_logic`, `boundary_fabric`,
`data_access`, `orchestration`, ...) so the result is a comparable taxonomy you
can query to find refactoring targets — business logic vs. boundary fabric, etc.

It works in two layers (`--layer`):

- **file** — the `# warehouse:file` anchor (default).
- **method** — `# warehouse:method` anchors on every function/method.
- **both** — file + methods in one Gemini call per file ("lights on").

In every layer it **validates existing anchors and replaces low-quality ones**
(placeholders like `[auto]`, non-vocab roles, generic responsibilities, wrong
path/depth, non-snake-case actors), not just fills gaps. Writes are minimal-diff:
only the anchor region changes, and a stray UTF-8 BOM is removed.

## Setup

Add a Gemini (Google AI Studio) key to `.env.local`:

```env
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.0-flash
```

## Usage

```bash
# Preview file anchors for one package, write nothing:
node bin/worker-bee.js --target <pkg> --dry-run

# File + method anchors ("lights on"), for real:
node bin/worker-bee.js --target <pkg> --layer both

# Only re-fix existing low-quality method anchors:
node bin/worker-bee.js --target <pkg> --layer method --mode revalidate

# Whole repo, file anchors first (after the pattern is proven):
node bin/worker-bee.js --layer file   # defaults --target to --repo-root
```

Key flags: `--repo-root` (default the ai-engine path; used for `expected_location`),
`--target` (subtree to scan), `--layer file|method|both`, `--mode all|missing|revalidate`,
`--agents`, `--limit`, `--model`, `--dry-run`, `--json`.

The run is idempotent — if Gemini is overloaded and a file errors, just re-run;
it picks up only what's left.

## Validate

```bash
cd C:/source/repos/bpm/internal/ai-engine
python packages/warehouse-intelligence-scripts-executor/scripts/taxonomy_comment_scanner.py --packet TAX-ANCHOR-1
```

## Files

- `src/worker-bee/anchor-spec.js` — anchor schema + Gemini prompts (file + combined)
- `src/worker-bee/scan.js` — analyze files, score anchor quality, write file anchors (minimal-diff, BOM-safe)
- `src/worker-bee/methods.js` — find defs, score/replace method anchors
- `src/worker-bee/gemini-client.js` — minimal AI Studio client w/ backoff (swap for Vertex here)
- `src/worker-bee/run-file-swarm.js` — per-file agent pool (both layers in one call)
- `src/worker-bee/run-swarm.js` — older file-batched file-anchor pool (kept for reference)
- `bin/worker-bee.js` — CLI entry
