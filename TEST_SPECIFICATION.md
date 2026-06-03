# Scanner Test Specification

**Purpose:** Define what the taxonomy scanner should detect as "needs work" so we have one clear authority for the baseline.

**Date Created:** 2026-06-03  
**Status:** Draft (ready for unit test implementation)

---

## Test Conditions

The scanner examines Python files in the configured packages folder. It checks each file's taxonomy header for:

1. **Presence** — Do required fields exist?
2. **Quality** — Is the content meaningful or placeholder?
3. **Clarity** — Is the text clear and specific?

### Required Taxonomy Fields

Every Python file should have these fields in its header comment:

| Field | Purpose | Example |
|-------|---------|---------|
| `responsibility` | What does this file do? | "Handles user authentication and session management" |
| `actor` | Which service owns it? | "auth_service" |
| `role` | What role does it play? | "gateway" |
| `source_truth` | Where is it defined? | "contract_backed_projection" |

### Conditions That Mark a File as "COMPLETE" ✅

A file is **complete** (does NOT need work) if:

- [ ] Has `responsibility` field present
- [ ] Has `actor` field present
- [ ] Has `role` field present
- [ ] Has `source_truth` field present
- [ ] Responsibility is NOT placeholder text (see below)
- [ ] Responsibility is NOT empty/whitespace
- [ ] Responsibility is NOT vague/generic (see below)
- [ ] Responsibility is at least 10 characters and contains meaningful words

### Conditions That Mark a File as "NEEDS WORK" ❌

A file **needs work** if ANY of these are true:

| Condition | Examples | Action |
|-----------|----------|--------|
| **Missing any required field** | No responsibility, no actor, no role, no source_truth | Mark as "needs work" |
| **Placeholder text in responsibility** | `noqa: F401, F403` \| `F403` \| `noqa` | Mark as "needs work" |
| **Init module placeholder** | `__init__ module` \| `__init__` \| `init file` | Mark as "needs work" |
| **Empty/whitespace responsibility** | (blank) \| (spaces only) | Mark as "needs work" |
| **Vague single-word responsibility** | `module` \| `file` \| `code` | Mark as "needs work" |
| **Generic/unclear responsibility** | `utilities` \| `helpers` \| `tools` \| `misc` | Mark as "needs work" |
| **No taxonomy header at all** | File has zero `warehouse:` comments | Mark as "needs work" |

---

## Acceptance Criteria

### Scanner Output

The scanner should report:

```
Total Python files: N
Complete taxonomy:  M
Needs work:         K (where K = N - M)

BASELINE: K files need taxonomy work
```

### Accuracy

- [ ] Scanner counts are accurate (within 0 errors)
- [ ] Counts can be verified manually
- [ ] Running scanner twice produces identical results
- [ ] Scanner completes in under 5 seconds for 3,000 files

### Single Source of Truth

- [ ] Scanner baseline (K files) is THE authority for "work to do"
- [ ] Worker-bee processes exactly against this baseline
- [ ] Progress report measures: completed / K files
- [ ] No conflicting definitions of "needs work"

---

## Gherkin Scenarios

### Feature: Taxonomy Scanner

```gherkin
Feature: Taxonomy Scanner
  As a developer working on taxonomy
  I want the scanner to accurately identify which files need work
  So the worker-bee knows exactly what to process

  Background:
    Given the scanner is configured to scan packages folder
    And scanner checks for fields: responsibility, actor, role, source_truth
```

### Scenario 1: Complete, meaningful taxonomy

```gherkin
  Scenario: File with complete, meaningful taxonomy
    Given a Python file with:
      | field          | value                                    |
      | responsibility | Handles user authentication and sessions |
      | actor          | auth_service                             |
      | role           | gateway                                  |
      | source_truth   | contract_backed_projection               |
    When the scanner checks this file
    Then it should mark it as "complete"
    And it should NOT count toward the "needs work" baseline
```

### Scenario 2: Missing responsibility field

```gherkin
  Scenario: File missing responsibility field
    Given a Python file with:
      | field          | value                      |
      | actor          | auth_service               |
      | role           | gateway                    |
      | source_truth   | contract_backed_projection |
    When the scanner checks this file
    Then it should mark it as "needs work"
    And the reason should be "missing responsibility"
```

### Scenario 3: Placeholder in responsibility (noqa)

```gherkin
  Scenario: File with linting directive instead of responsibility
    Given a Python file with:
      | field          | value                      |
      | responsibility | noqa: F401, F403           |
      | actor          | auth_service               |
      | role           | gateway                    |
      | source_truth   | contract_backed_projection |
    When the scanner checks this file
    Then it should mark it as "needs work"
    And the reason should be "placeholder in responsibility"
```

### Scenario 4: Init module placeholder

```gherkin
  Scenario: File with __init__ module placeholder
    Given a Python file with:
      | field          | value                      |
      | responsibility | __init__ module            |
      | actor          | auto_generated             |
      | role           | gateway                    |
      | source_truth   | contract_backed_projection |
    When the scanner checks this file
    Then it should mark it as "needs work"
    And the reason should be "placeholder in responsibility"
```

### Scenario 5: Empty responsibility

```gherkin
  Scenario: File with empty responsibility field
    Given a Python file with:
      | field          | value                      |
      | responsibility |                            |
      | actor          | auth_service               |
      | role           | gateway                    |
      | source_truth   | contract_backed_projection |
    When the scanner checks this file
    Then it should mark it as "needs work"
    And the reason should be "empty responsibility"
```

### Scenario 6: Vague one-word responsibility

```gherkin
  Scenario: File with single-word responsibility
    Given a Python file with:
      | field          | value                      |
      | responsibility | module                     |
      | actor          | auth_service               |
      | role           | gateway                    |
      | source_truth   | contract_backed_projection |
    When the scanner checks this file
    Then it should mark it as "needs work"
    And the reason should be "responsibility too vague"
```

### Scenario 7: Generic/unclear responsibility

```gherkin
  Scenario: File with generic responsibility
    Given a Python file with:
      | field          | value                      |
      | responsibility | utilities                  |
      | actor          | auto_generated             |
      | role           | gateway                    |
      | source_truth   | contract_backed_projection |
    When the scanner checks this file
    Then it should mark it as "needs work"
    And the reason should be "responsibility too generic"
```

### Scenario 8: No taxonomy header

```gherkin
  Scenario: File with no taxonomy comments
    Given a Python file with no warehouse:file comment
    When the scanner checks this file
    Then it should mark it as "needs work"
    And the reason should be "missing all taxonomy"
```

### Scenario 9: Accurate baseline count

```gherkin
  Scenario: Scanner generates accurate baseline
    Given a folder with:
      | file type                        | count |
      | Files with complete taxonomy     | 20    |
      | Files with missing fields        | 50    |
      | Files with placeholders (noqa)   | 35    |
      | Files with placeholders (__init__)| 30   |
      | Files with empty responsibility  | 15    |
      | Files with vague responsibility  | 25    |
      | Files with no header             | 40    |
    When the scanner scans the folder
    Then it should report:
      | metric         | value |
      | total files    | 215   |
      | complete       | 20    |
      | needs work     | 195   |
    And baseline should be exactly 195 files
```

---

## Unit Test Implementation Plan

### Test File Location
`bin/verify-scan.test.js`

### Test Structure

Each test corresponds to a Gherkin scenario:

```javascript
describe('Scanner - Taxonomy Detection', () => {
  // Test 1: Complete taxonomy → NOT counted
  it('should mark file as complete when all fields present and meaningful', () => { ... })

  // Test 2: Missing responsibility → counted
  it('should mark file as needing work when responsibility is missing', () => { ... })

  // Test 3: Placeholder (noqa) → counted
  it('should mark file as needing work when responsibility has noqa placeholder', () => { ... })

  // Test 4: Placeholder (__init__) → counted
  it('should mark file as needing work when responsibility says __init__ module', () => { ... })

  // Test 5: Empty responsibility → counted
  it('should mark file as needing work when responsibility is empty', () => { ... })

  // Test 6: Vague responsibility → counted
  it('should mark file as needing work when responsibility is single word', () => { ... })

  // Test 7: Generic responsibility → counted
  it('should mark file as needing work when responsibility is generic', () => { ... })

  // Test 8: No header → counted
  it('should mark file as needing work when no taxonomy header', () => { ... })

  // Test 9: Baseline count → accurate
  it('should generate accurate baseline count', () => { ... })
})
```

---

## Success Criteria

- [ ] All 9 test scenarios pass (turn GREEN)
- [ ] Test output is clear: "X tests passed, 0 failed"
- [ ] Scanner produces deterministic results (same output every run)
- [ ] Baseline count is the single source of truth
- [ ] No more conflicting definitions of "needs work"
- [ ] Worker-bee will process exactly against this baseline
- [ ] Progress report will measure: files_completed / baseline

---

## Notes

- This specification is data-driven by Gherkin scenarios
- Each scenario has a clear Given/When/Then structure
- Tests are executable documentation
- The scanner becomes the authority; worker-bee responds to it
- No more confusion about percentages or scope
