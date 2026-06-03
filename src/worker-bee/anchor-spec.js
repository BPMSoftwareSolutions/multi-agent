// Taxonomy anchor spec for the worker-bee.
//
// This mirrors the ai-engine contract at contracts/anchor_contract.json and the
// scanner at packages/warehouse-intelligence-scripts-executor/scripts/taxonomy_comment_scanner.py.
// We deliberately keep a local copy instead of reaching into the substrate: the
// worker-bee is an isolated process. The python scanner remains the authority.

// Fields the model is asked to classify (the semantic taxonomy).
const MODEL_FIELDS = [
  "actor",
  "role",
  "responsibility",
  "source_truth",
  "mutation_policy",
  "generated",
];

// Full required field order for a `# warehouse:file` anchor, per anchor_contract.json.
const FILE_ANCHOR_FIELD_ORDER = [
  "actor",
  "role",
  "responsibility",
  "expected_location",
  "repo_root_depth",
  "source_truth",
  "mutation_policy",
  "generated",
];

// Controlled vocabularies handed to the model so the taxonomy stays comparable
// across files instead of being free text. These are guidance, not hard enums.
const ROLE_VOCAB = [
  "business_logic",        // domain rules / decisions specific to a product or workflow
  "boundary_fabric",       // generated/declared bridge between a contract and runtime
  "data_access",           // SQL/store/persistence access
  "orchestration",         // coordinates other components, workflow control
  "projection_compiler",   // turns source/contract into a projected artifact
  "script_executor",       // operational entrypoint / CLI / one-off driver
  "sdk_surface",           // client/SDK/API contract surface
  "telemetry_evidence",    // telemetry, evidence, audit, readiness
  "governance_authority",  // gates, claims, approvals, authority checks
  "test_support",          // test, fixture, conftest
  "infrastructure",        // generic plumbing / config / utility
];

const SOURCE_TRUTH_VOCAB = [
  "contract_backed_projection",
  "sql_backed",
  "filesystem",
  "code_only",
];

const MUTATION_POLICY_VOCAB = [
  "semantic_extension", // humans/agents may extend the meaning by hand
  "generated_only",     // only a generator may write this file
  "frozen",             // should not be edited
];

const SYSTEM_INSTRUCTION = `You are a code taxonomy classifier for a warehouse-intelligence codebase.
For each Python file you are given, classify it so a "# warehouse:file" anchor can be written.

Return ONLY JSON of this exact shape:
{
  "files": [
    {
      "path": "<the path exactly as given>",
      "actor": "<snake_case owning subsystem/actor, e.g. inventory_intake, document_slide_projection, infrastructure_services>",
      "role": "<one of: ${ROLE_VOCAB.join(", ")}>",
      "responsibility": "<short snake_case or plain phrase: what this file is responsible for>",
      "source_truth": "<one of: ${SOURCE_TRUTH_VOCAB.join(", ")}>",
      "mutation_policy": "<one of: ${MUTATION_POLICY_VOCAB.join(", ")}>",
      "generated": <true if the file looks machine-generated, else false>
    }
  ]
}

Rules:
- "role" is the most important field: distinguish real business_logic from boundary_fabric (generated/declared bridges) and from plain data_access/infrastructure. This is the signal used to find refactoring targets.
- "responsibility" must be specific to THIS file, not generic. Prefer a single clear clause.
- Use the controlled vocabularies above. If nothing fits, pick the closest and keep going.
- Do not invent paths. Echo back the path exactly as provided.
- Output strictly valid JSON. No markdown, no comments, no trailing commas.`;

// Required field order for a `# warehouse:method` anchor (owns is optional but
// we always emit it). Mirrors anchor_contract.json.
const METHOD_ANCHOR_FIELD_ORDER = [
  "responsibility",
  "input_contract",
  "output_contract",
  "owns",
  "forbidden",
  "validation",
];

// Combined instruction: classify the file AND each requested method in one call.
const COMBINED_SYSTEM_INSTRUCTION = `You are a code taxonomy classifier for a warehouse-intelligence codebase.
You are given one Python file and a list of its functions/methods (by numeric id).
Produce trustworthy, human-readable taxonomy anchors.

Return ONLY JSON of this exact shape:
{
  "file": {
    "actor": "<snake_case owning subsystem/actor>",
    "role": "<one of: ${ROLE_VOCAB.join(", ")}>",
    "responsibility": "<specific clause: what THIS file is responsible for>",
    "source_truth": "<one of: ${SOURCE_TRUTH_VOCAB.join(", ")}>",
    "mutation_policy": "<one of: ${MUTATION_POLICY_VOCAB.join(", ")}>",
    "generated": <true|false>
  },
  "methods": [
    {
      "id": <the numeric id given>,
      "responsibility": "<specific clause: what this function does>",
      "input_contract": "<expected inputs / required arguments, plain>",
      "output_contract": "<what it returns / its effect>",
      "owns": "<the single concern this function owns>",
      "forbidden": "<1-3 conceptual snake_case things it must NOT do, comma-separated>",
      "validation": "<how 'done/correct' is verified for this function>"
    }
  ]
}

Rules:
- Return one "methods" entry for EVERY id you are given; echo the id exactly.
- Be specific. Never output placeholders like "auto", "[auto]", "module", "tbd", or a single generic word.
- "forbidden" must be ABSTRACT concept tokens (e.g. silent_fallback, hidden_state_mutation, cross_boundary_write). Do NOT use identifiers, keywords, or substrings that literally appear in the function's code, or you will create false drift.
- "file.role" distinguishes real business_logic from boundary_fabric/data_access/infrastructure — this is the refactoring signal.
- Use the controlled vocabularies. Output strictly valid JSON: no markdown, no comments, no trailing commas.`;

// Multi-file instruction: one request classifies a PACKET of files at once. This
// is how a single bee covers many files in one Gemini call.
const PACKET_SYSTEM_INSTRUCTION = `You are a code taxonomy classifier for a warehouse-intelligence codebase.
You are given one or more Python files. Each file has a path and (optionally) a
list of its functions/methods by numeric id. Ids are scoped PER FILE.

Return ONLY JSON of this exact shape:
{
  "files": [
    {
      "path": "<echo the file path exactly>",
      "file": {
        "actor": "<snake_case owning subsystem/actor>",
        "role": "<one of: ${ROLE_VOCAB.join(", ")}>",
        "responsibility": "<specific clause: what THIS file is responsible for>",
        "source_truth": "<one of: ${SOURCE_TRUTH_VOCAB.join(", ")}>",
        "mutation_policy": "<one of: ${MUTATION_POLICY_VOCAB.join(", ")}>",
        "generated": <true|false>
      },
      "methods": [
        {
          "id": <the numeric id given for this file>,
          "responsibility": "<specific clause: what this function does>",
          "input_contract": "<expected inputs / required arguments>",
          "output_contract": "<what it returns / its effect>",
          "owns": "<the single concern this function owns>",
          "forbidden": "<1-3 abstract snake_case things it must NOT do, comma-separated>",
          "validation": "<how 'done/correct' is verified>"
        }
      ]
    }
  ]
}

Rules:
- Return exactly one "files" entry per file given; echo each path exactly.
- Return one "methods" entry per id listed for that file; ids are per-file.
- If a file lists no methods, return "methods": [].
- Be specific. Never output placeholders ("auto", "[auto]", "module", "tbd") or single generic words.
- "forbidden" must be ABSTRACT concept tokens (e.g. silent_fallback, hidden_state_mutation, cross_boundary_write) that do NOT literally appear in the code.
- "file.role" distinguishes real business_logic from boundary_fabric/data_access/infrastructure.
- Use the controlled vocabularies. Output strictly valid JSON: no markdown, no comments, no trailing commas.`;

module.exports = {
  MODEL_FIELDS,
  FILE_ANCHOR_FIELD_ORDER,
  METHOD_ANCHOR_FIELD_ORDER,
  ROLE_VOCAB,
  SOURCE_TRUTH_VOCAB,
  MUTATION_POLICY_VOCAB,
  SYSTEM_INSTRUCTION,
  COMBINED_SYSTEM_INSTRUCTION,
  PACKET_SYSTEM_INSTRUCTION,
};
