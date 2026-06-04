# Story Alignment System: Formal Documentation

**Date:** 2026-06-04  
**Status:** Validated by Architects (Feedback #1 & #2)  
**Purpose:** Governance lens for semantic code coherence

---

## Executive Summary

The **Story Alignment System** is a nonsense detector that prevents file-level claims from drifting from method-level evidence. It's a hard governance mechanism for ensuring architecture stays honest.

### The Problem It Solves

Files can have clean Git status but **semantic drift**:

```
FILE CLAIMS: "I am an orchestrator"
METHODS SAY: "I parse args, format output, strip BOMs, normalize paths, validate fields..."
VERDICT: 🚨 INCOHERENT — Semantic dirty
```

---

## Governance Model

### Three-Layer Verdict System

```
FILE ANCHOR (The Claim)
       ↓
METHOD RESPONSIBILITIES (The Evidence)
       ↓
COHERENCE SCORE (The Verdict)
       ↓
Action: Repair / Split / Re-anchor / Govern
```

### Key Enforcement Rule

**A file does not get trusted because it has a header.**  
**A file gets trusted when its methods prove the header true.**

### Two Types of Dirty

| Type | Meaning | Impact |
|------|---------|--------|
| **Git Dirty** | File changed on disk | Version control concern |
| **Semantic Dirty** | File story ≠ method behavior | Corrupts navigation, routing, delegation, agent understanding |

---

## Architecture of the System

### 1. Extract Phase (`bin/extract-taxonomy.js`)

- Reads all source files (bin/, src/)
- Extracts file-level headers (warehouse:file)
- Extracts method-level headers (warehouse:method)
- Outputs structured JSON: `reports/taxonomy-extracted.json`

**Output structure:**
```json
{
  "files": [
    {
      "path": "src/core/llm-client.js",
      "file": {
        "warehouse": "file",
        "responsibility": "Manages LLM API communication...",
        "actor": "core_runtime",
        "role": "llm_interface"
      },
      "methods": [
        {
          "name": "getApiKey",
          "taxonomy": {
            "responsibility": "Retrieves and validates API key..."
          }
        }
      ]
    }
  ]
}
```

### 2. Analyze Phase (`bin/analyze-story.js`)

- Computes semantic similarity between file and methods
- Detects red flags (generic descriptions, maintenance-only tasks)
- Generates coherence score per file
- Outputs analysis: `reports/story-analysis.json`

**Scoring logic:**
- Extract concepts (verbs, nouns) from both file and method responsibilities
- Measure word overlap
- Flag issues: too generic, isolated maintenance tasks, error-only methods
- Score = (methods_aligned / total_methods) × 100

### 3. Report Phase (`bin/generate-story-report.js`)

- Generates human-readable markdown narrative
- Shows what each file claims vs. what methods do
- Explains reasoning for coherence verdict
- Outputs: `reports/CODEBASE-STORY-REVIEW-LATEST.md`

---

## Current Health Assessment

**Overall Score: 25/100** ⚠️

| Status | Count | Notes |
|--------|-------|-------|
| Strong Stories (≥70) | 2 | Only files with 0 methods (no evidence of incoherence) |
| Moderate (50-70) | 0 | No files in this range |
| Weak (<50) | 40 | **Potential false narratives** |

### Root Causes (Architect Analysis)

#### 1. The Primitives Dump (Score 8-11/100)

**Example:** `src/worker-bee/scan.js`  
**Problem:** File claims to "scan and apply anchors" but has 20 methods doing: text manipulation, path normalization, BOM stripping, line-ending detection

**Why it fails:** Low-level engineering primitives drown out the stated purpose

**Fix:** Extract `stripBom()`, `normPath()`, `dominantEol()`, `splitKeepEnds()` to `shared/helpers/`

#### 2. The Router Disconnect (Score 2-9/100)

**Example:** `bin/worker-bee.js`, `src/studio.js`  
**Problem:** CLI entry points must parse args and render status, but taxonomy scorer sees these as unrelated to claimed purpose

**Why it fails:** Scorer penalizes necessary administrative boilerplate

**Fix:** Update file-level anchor to explicitly claim "parsing arguments and rendering status" as part of orchestration

#### 3. API Heavy Lift (Score 14-20/100)

**Example:** `src/core/llm-client.js`, `src/worker-bee/gemini-client.js`  
**Problem:** File's job is "API communication" but methods focus on defensive regex, JSON parsing, HTTP framing

**Why it fails:** Implementation details don't map to high-level purpose

**Fix:** Either extract parsing utilities OR rewrite file anchor to include "request building and response parsing"

---

## Improvement Strategies

### Strategy 1: Ruthlessly Extract Utility Primitives

**Action:**
- Identify low-level helpers: `stripBom`, `normPath`, `toTrimmedString`, `dominantEol`, `splitKeepEnds`
- Move to new file: `src/shared/string-utils.js` or `src/utils/text.js`
- Update imports across codebase

**Taxonomy Benefit:**
- Parent files lose "noise" methods
- Coherence scores rise significantly
- Utility file's responsibility becomes clear: "Low-level string and path primitives"

**Files to tackle:**
- `src/worker-bee/scan.js` (8/100) → Extract 8+ utility methods
- `src/shared/actions.js` (11/100) → Extract normalization functions

### Strategy 2: Expand File-Level Anchors for Routers

**Current (Bad):**
```javascript
// responsibility: Main CLI orchestrator that distributes taxonomy work
```

**Better:**
```javascript
// responsibility: Main CLI entry point. Parses execution arguments, routes commands to handlers, 
// distributes anchor work to Gemini agents, and renders live status updates.
```

**Taxonomy Benefit:**
- Explicitly claims `parseArgs` and `renderStatus` as part of orchestration
- Methods become evidence supporting the claim
- Coherence score rises from 2/100 to ~40/100

**Files to fix:**
- `bin/worker-bee.js` (2/100)
- `bin/studio.js` (9/100)
- `src/studio.js` (if exists)

### Strategy 3: Tune Scoring Weights

**Current issue:** Scorer treats all methods equally. This penalizes high-LOC files.

**Proposed tuning:**
- **Boilerplate discount:** Reduce penalty for standard methods like `parseArgs`, `formatOutput`, `validateInput`
- **Core business weighting:** Weight semantic-critical methods higher
- **No-method penalty removal:** Don't reward files for having 0 methods (they haven't proven anything)

**Implementation:**
```javascript
// Example: parseArgs should have lower alignment requirement
if (methodName === 'parseArgs' || methodName === 'renderStatus') {
  alignmentThreshold = 30; // More lenient
} else {
  alignmentThreshold = 50; // Standard
}
```

---

## Running the System

### Step 1: Extract Taxonomy

```bash
node bin/extract-taxonomy.js
# Output: reports/taxonomy-extracted.json
```

### Step 2: Analyze Stories

```bash
node bin/analyze-story.js
# Output: reports/story-analysis.json
```

### Step 3: Generate Report

```bash
node bin/codebase-story-review-report.js
# Output: reports/CODEBASE-STORY-REVIEW-LATEST.md
```

### All at once

```bash
node bin/extract-taxonomy.js && node bin/analyze-story.js && node bin/codebase-story-review-report.js
```

---

## Next Actions

### Immediate (Phase 1 - This Sprint)

- [ ] Document improvement strategies (✅ DONE - this file)
- [ ] Identify files to refactor using Primitives Dump fix
- [ ] Extract utility helpers from `src/worker-bee/scan.js`
- [ ] Rewrite file anchors for router files

### Near-term (Phase 2)

- [ ] Implement scoring weight tuning in analyzer
- [ ] Re-run full analysis on refactored code
- [ ] Target: Get average score from 25/100 to 50+/100

### Long-term (Phase 3)

- [ ] Document this as architectural governance standard
- [ ] Apply to 2,988 Python files in packages folder
- [ ] Integrate into CI/CD as semantic health check

---

## Success Criteria

| Metric | Target | Status |
|--------|--------|--------|
| Overall Health Score | 50+ / 100 | Currently 25/100 |
| Strong Stories (≥70) | 15+ files | Currently 2 |
| Weak Stories (<50) | <10 files | Currently 40 |
| Files with zero utilities in main responsibility | 95%+ | TBD |

---

## References

- Architect Feedback #1: Governance and enforcement model
- Architect Feedback #2: Root cause analysis and fix strategies
- `reports/CODEBASE-STORY-REVIEW-LATEST.md`: Current codebase story review of taxonomy coherence and file economy
- `reports/taxonomy-extracted.json`: Raw taxonomy data
- `reports/story-analysis.json`: Coherence analysis data
