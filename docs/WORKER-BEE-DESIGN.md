# Worker-Bee Design & Deployment

How the taxonomy worker-bee is built, how the bees are deployed, and how we
scale the run across the ai-engine codebase. Companion to [WORKER-BEE.md](WORKER-BEE.md)
(usage) — this doc is the "how it works" view.

---

## 1. Mental model

A **worker bee** here is not a long-lived service or an agent wired into the
ai-engine substrate. It is a **stateless unit of work**: "take a *packet* of files,
classify them, write trustworthy anchors back." The studio is the **hive** that
finds work, packs it, deploys a few bees, and collects results.

Crucially, **the bee does not decide its own workload — a packet does.** How many
files and anchors a bee carries per request is set by `src/worker-bee/packet.js`
(or a `--packet` file), exactly like the substrate drives its workers from an
external spec. Tell a bee to carry 150 anchors and it carries 150; tell it 50 and
it carries 50. No limit is hardcoded in the execution code.

Three hard rules shape the design:

1. **Isolated.** Nothing touches the ai-engine substrate, learning loop, or SQL
   governance. We only *read* two ai-engine artifacts as spec + oracle:
   `contracts/anchor_contract.json` (the schema) and `taxonomy_comment_scanner.py`
   (the authority that grades the result).
2. **Packet-driven workload.** Every budget (anchors/request, files/packet,
   method batch size, output tokens, bee count, passes) comes from the packet, not
   from constants inside the bee.
3. **Deterministic where we can be.** Facts that can be computed (file path,
   `repo_root_depth`) are computed in code. The model is only asked for the
   *semantic* judgement (actor, role, responsibility, method contracts).
4. **Idempotent and additive.** Anchors are comments. A bee can be re-run safely;
   it only acts on files that still need work. Failures never leave partial state.

---

## 2. Component map

```
bin/worker-bee.js              ← CLI / the hive controller (pass loop, reporting)
  └─ src/worker-bee/
       packet.js               ← the INSTRUCTION: defaults + packet-file/flag merge (workload lives here)
       scan.js                 ← find work, score anchor quality, write FILE anchors
       methods.js              ← find defs, score/replace METHOD anchors
       anchor-spec.js          ← the anchor schema + the Gemini prompts (single + multi-file)
       gemini-client.js        ← one Gemini call, with JSON-repair + backoff
       run-file-swarm.js       ← the bee pool: packs work into packets, N bees, no hardcoded limits
       run-swarm.js            ← (legacy) earlier file-batched file-only pool
```

Data the controller passes around:

- **work item** = one file that needs something: `{ absPath, path, deterministic,
  fileExisting, fileNeed (doFile), methodsNeeding[] (doMethods) }`.
- **deterministic** = `{ expected_location, repo_root_depth }`, computed, never from the model.

---

## 3. The pipeline for one file (one bee)

```
analyzeFile(file)                        [scan.js / methods.js]
  ├─ strip BOM, compute expected_location + repo_root_depth
  ├─ FILE layer: parse existing # warehouse:file anchor → assessAnchor()
  │     issues = missing | placeholder | off-vocab role | non-snake actor
  │              | generic responsibility | wrong path | wrong depth
  └─ METHOD layer: findDefs() → for each def, methodAnchorAbove() → assessMethodAnchor()
        issues = missing | [auto]/placeholder fields | generic responsibility

if the file needs work → hand to a bee:

processFile(file)                         [run-file-swarm.js]
  ├─ read full file text (flash has ~1M input context — no truncation needed)
  ├─ batch methodsNeeding into groups of 25       ← keeps JSON OUTPUT bounded
  ├─ for each batch: callGemini(file + method list) → { file, methods[] }
  │     • model returns ONLY semantic fields, by method id
  │     • JSON-mode + repair/backoff in gemini-client.js
  ├─ apply METHOD anchors bottom-up   (line indices stay stable)   [methods.applyMethodAnchors]
  └─ apply FILE anchor on top         (regex/offset replace, BOM removed) [scan.replace/insertAnchor]

writes are MINIMAL-DIFF: only the anchor region changes; untouched lines keep
their exact bytes and line endings.
```

Why methods-first-then-file: method edits are addressed by line index; doing the
top-of-file insert last means it can't shift the indices the method pass relied on.

Why deterministic-fields-in-code: the model never sees or guesses paths, so
`expected_location` and `repo_root_depth` can't drift — they're recomputed every run.

---

## 4. How the bees are deployed (fan-out)

First the hive **packs** the work into packets sized by the packet's workload, then
runs a **fixed-size pool of bees over a shared cursor of packets**:

```
work = [ files needing work ]
packets = packWork(work, packet.workload)     ← greedy fill to anchor_budget / file cap
cursor = 0
spawn min(agents, packets.length) bee loops:

   bee #k:  while cursor < packets.length:
              i = cursor++                 ← atomic-ish pull (single-threaded JS)
              processPacket(packets[i])    ← ONE Gemini request for the whole packet
              report progress

await all bees
```

- **A packet of many files per request.** A bee sends one request carrying every
  file in its packet (file content + the method ids to anchor) and gets one JSON
  response back with anchors for all of them. 1,500 small files → ~38 requests, not
  1,500. This is the key rate-limit lever.
- **Oversize files split out.** If a single file's anchor cost exceeds
  `anchor_budget` (e.g. `client.py` with 250 methods), it becomes its own packet and
  is internally method-batched (`method_batch` per call). So big files don't blow
  the output-token cap, and small files still ride together.
- **Different bees never share a file**, so writes are conflict-free without locking.
- **`packet.swarm.agents`** = how many bees fly at once (the throughput / rate dial).
- Pure async concurrency in one Node process — no threads, no IPC. JS single-threaded
  execution makes the shared `cursor++` safe.

---

## 5. How we scale across the codebase

Three nested loops, outermost to innermost:

```
CLUSTER  (shell)            for each package in a cluster: run the bee on that --target
   │
   PASS  (max_passes)       re-run findWork+swarm until 0 work or no progress (self-heal)
      │
      BEES (swarm.agents)   a few bees, each pulling packets from the queue
         │
         PACKET             one request carries up to anchor_budget anchors across many files
            │
            (oversize)      a method-heavy file splits into method_batch-sized calls
```

Every number above (`max_passes`, `agents`, `anchor_budget`, `method_batch`) is a
packet field, not a constant — change the packet, change the deployment.

### Scope is set by `--target`, not by crawling everything at once
We point the bee at a single package (`--target packages/<name>`). `expected_location`
is still computed against `--repo-root` (the ai-engine root) so anchors are correct
no matter how narrow the target. A "cluster run" is just a shell `for` loop over
related packages (e.g. all `*-sdk-*`). This keeps each run observable and bounded.

### Passes make it self-healing
After a swarm, the controller calls `findWork` again. Because work-finding only
returns files that *still* need anchors, a second pass naturally retries just the
failures. It stops when:
- `work.length === 0` (clean), or
- a pass makes **no progress** (same count as last pass → persistent, not transient), or
- `--max-passes` is hit (default 3).

This is what turns transient Gemini "high demand" 503s into a non-event: the
overloaded files simply get picked up on the next pass.

### Idempotency makes re-running free
Re-pointing the bee at an already-done package costs one filesystem scan and prints
"nothing to do." So you can re-run a cluster any time to top it up.

---

## 6. The grading loop (trust)

The bee's own `assessAnchor`/`assessMethodAnchor` decide *what to work on*. The
**authoritative grade** is the ai-engine python scanner, run separately:

```
python .../taxonomy_comment_scanner.py --packet TAX-ANCHOR-1   (file anchors)
python .../taxonomy_comment_scanner.py --packet TAX-ANCHOR-2   (file + method anchors)
```

It triangulates comment ↔ code ↔ (eventually) SQL and emits drift. Our success bar
per package is **0 drift, 0 validation fails** (benign `repo_root_depth` warnings on
files with no `parents[N]` literal are expected). The scanner — not the bee — is the
source of truth; the bee just makes the scanner pass.

---

## 7. Failure modes & how they're handled

| Failure | Cause | Handling |
|---|---|---|
| BOM-hidden anchors | files saved with `U+FEFF` before `#` | detection strips BOM; writer removes it |
| Whole-file diff churn | mixed CRLF/LF rewritten wholesale | minimal-diff writer touches only the anchor region |
| Gemini "high demand" 503 | model overload | backoff (1→8s) + pass-loop retry; idempotent |
| Truncated JSON on huge files | output-token cap on 200+ method files | **method batching** (25/call) keeps output bounded |
| Model omits a method id | partial response | counted as `methodsMissingFromResponse`; re-run picks it up |
| `forbidden` token in real body | would trip scanner RESPONSIBILITY_DRIFT | prompt forces abstract concept tokens, not code substrings |

---

## 8. Current deployment status (sdk cluster)

- Validated packages: `warehouse-intelligence-sdk-core` (8 files, both layers, scanner-clean),
  `warehouse-intelligence-ai-engine-sdk-core` (34 files; file layer done, method layer
  in progress — method-heavy files like `client.py` (250) and `__init__.py` (205)
  drove the method-batching fix).
- The remaining `*-sdk-*` packages are 1-file re-exports, completed in the cluster run.

### Next scale steps (not yet done)
1. Move from per-package shell loops to a small driver that takes a cluster glob
   and runs packages sequentially with a combined report.
2. Pick the next cluster (e.g. `*-persistence-stores`) and run `--layer both`.
3. After each cluster, run the python scanner and record the 0-drift evidence.
