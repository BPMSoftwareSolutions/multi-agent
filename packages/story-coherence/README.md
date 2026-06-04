# @loc/story-coherence

Read-only story coherence SDK for JavaScript and Python scanning, story review, AI-ready reasoning packets, governance verdicts, and README projections.

This package gives LOC and AI agents structured evidence. It does not perform healing mutation, call an AI provider, or make governance decisions by itself.

## API

```js
const {
  scanTaxonomy,
  buildCodebaseStoryReview,
  buildStoryReasoningPacket,
  checkCodebaseStory,
  explainStoryPath,
  generateReadmeProjection,
} = require("@loc/story-coherence");
```

## CLI

```bash
loc-story scan . --write
loc-story review --write
loc-story packet --for-ai --write
loc-story check
loc-story explain src/worker-bee
loc-story readme . --out README.md
loc-story residue
```

## Evidence Chain

Story coherence is earned only when all gates pass together:

```text
local taxonomy tie-out
+ filesystem story
+ README alignment
+ canonical residue
+ file economy
= whole codebase story coherence
```

## AI Boundary

The package produces observed evidence and projections. AI reviewers may interpret the story reasoning packet, but LOC governance decides whether the advisory judgment becomes accepted, blocked, or converted into work.

## Supported Source Files

| Language | Extension | Anchor comment |
| --- | --- | --- |
| JavaScript | `.js` | `// warehouse:file` and `// warehouse:method` |
| Python | `.py` | `# warehouse:file` and `# warehouse:method` |

## Governance Rules

1. Overall story coherence cannot be earned if local tie-out is not 100.
2. Overall story coherence cannot be earned if filesystem placement has path-language issues.
3. Overall story coherence cannot be earned if README projections are stale.
4. Overall story coherence cannot be earned if residue pressure is greater than 0.
5. Overall story coherence cannot be earned if file economy has unearned boundaries.
6. Mutation is outside this package boundary.
