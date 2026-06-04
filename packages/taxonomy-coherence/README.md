# @loc/taxonomy-coherence

Read-only taxonomy coherence SDK for scanning, story review, governance verdicts, and README projections.

This package reads, evaluates, and projects verified codebase story state. It does not perform healing mutation.

## API

```js
const {
  scanTaxonomy,
  buildCodebaseStoryReview,
  generateReadmeProjection,
} = require("@loc/taxonomy-coherence");
```

## CLI

```bash
loc-taxonomy scan . --write
loc-taxonomy story-review --write
loc-taxonomy readme . --out README.md
loc-taxonomy residue
```

## Governance Rules

1. Overall story coherence cannot be earned if local tie-out is not 100.
2. Overall story coherence cannot be earned if residue pressure is greater than 0.
3. Overall story coherence cannot be earned if file economy has unearned boundaries.
4. README projections must declare source scan and story-review IDs.
5. Generated README files are projections, not independent source truth.
6. Mutation is outside this package boundary.
