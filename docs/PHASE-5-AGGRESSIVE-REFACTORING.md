# Phase 5: Aggressive Refactoring — The Spielberg Edit

**Mission:** Transform messy, multi-purpose files into focused, coherent modules.  
**Vision:** Every file does ONE thing brilliantly. Every story is TRUE.  
**Goal:** 28/100 → 50+/100 coherence in 3 weeks.  
**Standard:** Spielberg-level clarity and precision.

---

## 🎯 Strategic Overview

### The Approach
Instead of one file doing 10 things poorly, we'll have 10 files each doing 1 thing perfectly.

### The Targets
**Top 6 Files to Refactor** (in order of impact):

| File | Current | Target | Split Plan | Impact |
|------|---------|--------|-----------|--------|
| **analyze-story.js** | 10/100 | 100/100 | 3 modules | HIGH |
| **text-utils.js** | 10/100 | 100/100 | 4 modules | HIGH |
| **run-file-swarm.js** | 11/100 | 100/100 | 5 modules | CRITICAL |
| **scan.js** | 11/100 | 100/100 | 4 modules | CRITICAL |
| **prompt-builders.js** | 12/100 | 100/100 | 4 modules | HIGH |
| **run-swarm.js** | 12/100 | 100/100 | 3 modules | HIGH |

**Total:** 23 new focused modules from 6 bloated ones.

---

## 📋 WAVE 1: The Story Analyzers (Days 1-3)

### Target: analyze-story.js (10/100 → 3 modules at 100/100)

**Current Horror:**
```javascript
// analyze-story.js (1 file, 9 methods doing 9 different things)
- extractConcepts()        // text analysis
- computeSimilarity()      // matching algorithm
- isBoilerplate()          // classification
- getAlignmentThreshold()  // scoring rules
- detectRedFlags()         // validation
- evaluateFileCoherence()  // orchestration
- generateReport()         // formatting
- writeReport()            // I/O
- main()                   // CLI
```

**The Refactored Future:**
```
src/story-analysis/
├── concepts-extractor.js (100/100)
│   └── extractConcepts()
│       Responsibility: "Extracts concepts and verbs from responsibility text"
│
├── similarity-engine.js (100/100)
│   ├── computeSimilarity()
│   ├── isBoilerplate()
│   └── getAlignmentThreshold()
│       Responsibility: "Computes semantic alignment scores with thresholds"
│
└── coherence-evaluator.js (100/100)
    ├── detectRedFlags()
    ├── evaluateFileCoherence()
    ├── generateReport()
    ├── writeReport()
    └── main()
    Responsibility: "Evaluates file coherence and generates reports"
```

**Why This Works:**
- **concepts-extractor.js:** Pure text parsing → 100% coherent
- **similarity-engine.js:** Scoring and classification → 100% coherent
- **coherence-evaluator.js:** Orchestration and reporting → 100% coherent

**Expected Improvement:** 10→100, 10→100, 10→100 = All modules pristine

---

## 📋 WAVE 2: The Text Utilities (Days 4-6)

### Target: text-utils.js (10/100 → 4 modules at 100/100)

**Current Horror:**
```javascript
// text-utils.js (1 file, 9 different utility functions)
- stripBom()               // encoding
- repoRelative()           // path math
- computeRepoRootDepth()   // path calculation
- dominantEol()            // line ending detection
- splitKeepEnds()          // text splitting
- isPlaceholder()          // validation
- isGenericResponsibility()// validation
- normPath()               // path normalization
```

**The Refactored Future:**
```
src/worker-bee/text-processing/
├── encoding-utils.js (100/100)
│   └── stripBom()
│       Responsibility: "Removes UTF-8 BOM and normalizes text encoding"
│
├── path-utils.js (100/100)
│   ├── repoRelative()
│   ├── computeRepoRootDepth()
│   └── normPath()
│       Responsibility: "Converts paths to repo-relative POSIX format with depth"
│
├── line-ending-utils.js (100/100)
│   └── dominantEol(), splitKeepEnds()
│       Responsibility: "Detects and preserves platform-specific line endings"
│
└── validation-utils.js (100/100)
    ├── isPlaceholder()
    └── isGenericResponsibility()
    Responsibility: "Validates responsibility fields for specificity"
```

**Expected Improvement:** 10→100 across all 4 modules

---

## 📋 WAVE 3: The Packet Swarm (Days 7-12) — CRITICAL

### Target: run-file-swarm.js (11/100 → 5 modules at 100/100)

**Current Horror:**
```javascript
// run-file-swarm.js (1 file, 11 methods doing 5 completely different things)
- chunk()                  // array partitioning
- readForPrompt()          // file I/O + truncation
- anchorCost()             // calculation
- fileChars()              // file analysis
- packWork()               // packing algorithm
- methodList()             // formatting
- buildPacketPrompt()      // prompt construction
- applyToItem()            // anchor application
- processOversizeFile()    // special case handling
- processPacket()          // API orchestration
- runFileSwarm()           // concurrency management
```

**The Refactored Future:**
```
src/worker-bee/file-swarm/
├── work-packer.js (100/100)
│   ├── chunk()
│   ├── anchorCost()
│   ├── fileChars()
│   └── packWork()
│   Responsibility: "Partitions work items into packets within token budgets"
│
├── file-reader.js (100/100)
│   ├── readForPrompt()
│   Responsibility: "Reads and truncates files to character budgets"
│
├── prompt-builder.js (100/100)
│   ├── methodList()
│   ├── buildPacketPrompt()
│   Responsibility: "Constructs Gemini prompts from file packets and metadata"
│
├── anchor-applicator.js (100/100)
│   ├── applyToItem()
│   ├── processOversizeFile()
│   ├── processPacket()
│   Responsibility: "Applies anchors via Gemini API with adaptive retry"
│
└── swarm-orchestrator.js (100/100)
    ├── runFileSwarm()
    Responsibility: "Orchestrates concurrent bee agents processing work queue"
```

**Why This Matters:** This is the most complex file. Getting it right sets the standard.

---

## 📋 WAVE 4: The Anchor Scanner (Days 13-15) — CRITICAL

### Target: scan.js (11/100 → 4 modules at 100/100)

**Current Horror:**
```javascript
// scan.js (1 file, 12 methods doing 4 completely different things)
- listPythonFiles()        // file discovery
- hasFileAnchor()          // detection
- findMissing()            // analysis
- buildAnchorBlock()       // construction
- insertAnchor()           // application (insert)
- parseFileAnchorLines()   // parsing
- parseFileAnchor()        // parsing wrapper
- assessAnchor()           // validation
- replaceAnchor()          // application (replace)
- analyzeFile()            // orchestration
- serializeWork()          // serialization
- findWork()               // orchestration
```

**The Refactored Future:**
```
src/worker-bee/anchor-scanner/
├── file-discoverer.js (100/100)
│   ├── listPythonFiles()
│   Responsibility: "Recursively discovers Python files in directory tree"
│
├── anchor-parser.js (100/100)
│   ├── parseFileAnchorLines()
│   ├── parseFileAnchor()
│   ├── hasFileAnchor()
│   Responsibility: "Parses and extracts warehouse:file anchors from text"
│
├── anchor-builder.js (100/100)
│   ├── buildAnchorBlock()
│   ├── insertAnchor()
│   ├── replaceAnchor()
│   Responsibility: "Constructs and applies file anchors with minimal diffs"
│
└── anchor-auditor.js (100/100)
    ├── assessAnchor()
    ├── analyzeFile()
    ├── findMissing()
    ├── serializeWork()
    ├── findWork()
    Responsibility: "Audits Python files for anchor completeness and quality"
```

---

## 📋 WAVE 5: The Prompt Builders (Days 16-18)

### Target: prompt-builders.js (12/100 → 4 modules at 100/100)

**Current Horror:**
```javascript
// prompt-builders.js (1 file, 7 methods doing different things)
- schemaToText()           // schema conversion
- toJSONString()           // serialization
- buildRoundContext()      // context assembly
- formatHumanInterjection()// normalization
- buildIntentPrompt()      // agent 1 prompt
- buildBuilderPrompt()     // agent 2 prompt
- buildReviewerPrompt()    // agent 3 prompt
```

**The Refactored Future:**
```
src/core/prompts/
├── schema-formatter.js (100/100)
│   ├── schemaToText()
│   ├── toJSONString()
│   Responsibility: "Converts schemas to formatted JSON for prompt embedding"
│
├── context-builder.js (100/100)
│   ├── buildRoundContext()
│   ├── formatHumanInterjection()
│   Responsibility: "Builds previous round context for agent prompts"
│
├── intent-prompter.js (100/100)
│   ├── buildIntentPrompt()
│   Responsibility: "Constructs intent clarification prompts for agents"
│
└── agent-prompters.js (100/100)
    ├── buildBuilderPrompt()
    ├── buildReviewerPrompt()
    Responsibility: "Constructs planner and reviewer agent prompts"
```

---

## 📋 WAVE 6: The File-Level Swarm (Days 19-21)

### Target: run-swarm.js (12/100 → 3 modules at 100/100)

**Similar split pattern to run-file-swarm.js**

```
src/worker-bee/file-level-swarm/
├── file-reader.js (100/100)
├── prompt-builder.js (100/100)
├── swarm-orchestrator.js (100/100)
```

---

## 🎬 The Execution Plan

### Weekly Breakdown

```
WEEK 1: Foundation & First Wave
├─ Day 1: Plan & Design (THIS DOCUMENT)
├─ Day 2: Refactor analyze-story.js (3 modules)
├─ Day 3: Refactor text-utils.js (4 modules)
├─ Day 3: TEST & PUSH TO MAIN
├─ Day 4: Update imports across codebase
└─ Day 5: Re-run analysis, document progress

WEEK 2: The Heavy Lifting
├─ Days 7-12: Refactor run-file-swarm.js (5 modules) — CRITICAL
├─ Days 13-15: Refactor scan.js (4 modules) — CRITICAL
├─ Days 15: TEST & PUSH TO MAIN
└─ Day 15: Validate no regressions

WEEK 3: Final Push
├─ Days 16-18: Refactor prompt-builders.js (4 modules)
├─ Days 19-21: Refactor run-swarm.js (3 modules)
├─ Day 21: TEST & VALIDATE
└─ Day 21: FINAL PUSH TO MAIN

FINAL DELIVERABLE:
├─ 23 new focused modules
├─ 6 bloated files eliminated
├─ All modules at 100% coherence
├─ Overall health: 28/100 → 55+/100 expected
└─ Story: Pristine, Spielberg-level
```

---

## 🏆 Success Criteria

### Per-Module Standard
- ✅ One file = One responsibility
- ✅ File anchor matches ALL methods 100%
- ✅ No method does something unrelated
- ✅ Every method contributes to the stated purpose

### Codebase Standard
- ✅ No semantic vocabulary mismatch
- ✅ No file promising "orchestration" that just does "parsing"
- ✅ Import chains clear (who calls what)
- ✅ Tests pass, no functionality broken

### Story Standard
- ✅ README for each module explaining its role
- ✅ Clear separation of concerns
- ✅ Any developer can pick up a module and understand it instantly
- ✅ No false narratives. Zero.

---

## 📊 Expected Results

### Coherence Improvements

| Wave | Files | Before | After | Impact |
|------|-------|--------|-------|--------|
| **Wave 1** | 3 new modules | 10/100 | 100/100 | +90pts each |
| **Wave 2** | 4 new modules | 10/100 | 100/100 | +90pts each |
| **Wave 3** | 5 new modules | 11/100 | 100/100 | +89pts each |
| **Wave 4** | 4 new modules | 11/100 | 100/100 | +89pts each |
| **Wave 5** | 4 new modules | 12/100 | 100/100 | +88pts each |
| **Wave 6** | 3 new modules | 12/100 | 100/100 | +88pts each |
| **TOTAL** | **23 new** | **—** | **—** | **Expected: 55+/100** |

### Story Quality

```
BEFORE: "Our code does lots of stuff, we're not sure what"
AFTER: "We have a file discovery engine, a prompt builder, 
        an anchor parser, a packet orchestrator, and a swarm runner.
        Each one is brilliant at its job."
```

---

## 🎓 Lessons Learned Carry Forward

### What Makes a Module "Perfect"?
1. **One job:** File does ONE thing
2. **Clear methods:** Each method advances that job
3. **Honest anchor:** Description matches reality 100%
4. **Clean imports:** Only imports what it needs
5. **No surprises:** Method names match what they do

### Pattern for Future Refactoring
- Identify methods that do different things
- Group related methods together
- Each group becomes a new focused module
- Each module gets one true anchor
- Test thoroughly, push confidently

---

## 🚀 Ready to Begin?

This is where code becomes ART.

Every module will be:
- ✅ Perfectly coherent
- ✅ Instantly understandable
- ✅ Brilliantly focused
- ✅ Spielberg-worthy

Let's make it happen.

---

**Phase 5 Start Date:** NOW  
**Phase 5 End Date:** +21 days  
**Expected Outcome:** 55+/100 coherence, pristine code, legendary story  
**Quality Standard:** Spielberg. Nothing less.
