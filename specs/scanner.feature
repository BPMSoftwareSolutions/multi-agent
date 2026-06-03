Feature: Taxonomy Scanner
  As a developer
  I want to know which Python files have good taxonomy anchors
  So I can focus rewriting effort on files that actually need work

  Background:
    Given the scanner is configured to scan the packages folder
    And the scanner looks for required taxonomy fields: responsibility, actor, role, source_truth

  # ============= GOOD TAXONOMY (should NOT need work) =============

  Scenario: File with complete, meaningful taxonomy
    Given a Python file with:
      | field          | value                                          |
      | responsibility | Handles user authentication and session mgmt |
      | actor          | auth_service                                   |
      | role           | gateway                                        |
      | source_truth   | contract_backed_projection                     |
    When the scanner checks this file
    Then it should mark it as "complete" (does not need work)

  # ============= MISSING FIELDS (should need work) =============

  Scenario: File missing responsibility field
    Given a Python file with:
      | field          | value                      |
      | actor          | auth_service               |
      | role           | gateway                    |
      | source_truth   | contract_backed_projection |
    When the scanner checks this file
    Then it should mark it as "needs work"
    And the reason is "missing responsibility"

  Scenario: File missing actor field
    Given a Python file with:
      | field          | value                          |
      | responsibility | Handles user authentication    |
      | role           | gateway                        |
      | source_truth   | contract_backed_projection     |
    When the scanner checks this file
    Then it should mark it as "needs work"
    And the reason is "missing actor"

  Scenario: File with no taxonomy header at all
    Given a Python file with no warehouse:file comment
    When the scanner checks this file
    Then it should mark it as "needs work"
    And the reason is "missing all taxonomy"

  # ============= PLACEHOLDER TEXT (should need work) =============

  Scenario: File with linting directive instead of responsibility
    Given a Python file with:
      | field          | value                      |
      | responsibility | noqa: F401, F403           |
      | actor          | auto_generated             |
      | role           | gateway                    |
      | source_truth   | contract_backed_projection |
    When the scanner checks this file
    Then it should mark it as "needs work"
    And the reason is "placeholder in responsibility (noqa)"

  Scenario: File with __init__ module placeholder
    Given a Python file with:
      | field          | value                      |
      | responsibility | __init__ module            |
      | actor          | auto_generated             |
      | role           | gateway                    |
      | source_truth   | contract_backed_projection |
    When the scanner checks this file
    Then it should mark it as "needs work"
    And the reason is "placeholder in responsibility (__init__)"

  Scenario: File with empty or whitespace-only responsibility
    Given a Python file with:
      | field          | value                      |
      | responsibility |                            |
      | actor          | auth_service               |
      | role           | gateway                    |
      | source_truth   | contract_backed_projection |
    When the scanner checks this file
    Then it should mark it as "needs work"
    And the reason is "empty responsibility"

  # ============= UNCLEAR/GENERIC TEXT (should need work) =============

  Scenario: File with vague one-word responsibility
    Given a Python file with:
      | field          | value                      |
      | responsibility | module                     |
      | actor          | auth_service               |
      | role           | gateway                    |
      | source_truth   | contract_backed_projection |
    When the scanner checks this file
    Then it should mark it as "needs work"
    And the reason is "responsibility too vague (single word)"

  Scenario: File with generic responsibility that doesn't explain purpose
    Given a Python file with:
      | field          | value                      |
      | responsibility | utilities                  |
      | actor          | auto_generated             |
      | role           | gateway                    |
      | source_truth   | contract_backed_projection |
    When the scanner checks this file
    Then it should mark it as "needs work"
    And the reason is "responsibility too generic"

  # ============= SUMMARY =============

  Scenario: Scanner generates accurate baseline count
    Given a folder with:
      | file type                  | count |
      | Files with good taxonomy   | 15    |
      | Files with missing fields  | 42    |
      | Files with placeholders    | 28    |
      | Files with vague text      | 19    |
      | Files with no header       | 31    |
    When the scanner scans the folder
    Then it should report:
      | metric          | value |
      | total files     | 135   |
      | complete        | 15    |
      | needs work      | 120   |
      | baseline scope  | 120   |
    And the worker-bee should process exactly 120 files
