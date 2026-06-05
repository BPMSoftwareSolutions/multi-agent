// warehouse:file
// responsibility: Scores file coherence by the share of methods carrying a distinct, specific, single responsibility instead of copying the file or each other
// actor: coherence_analyzer
// role: analyzer
// source_truth: implementation

const { isBoilerplate } = require("./similarity-engine");

const PLACEHOLDER_TOKENS = new Set(["", "auto", "unknown", "tbd", "todo", "placeholder", "xxx"]);

// warehouse:method
// responsibility: Reports whether a responsibility string is a placeholder token or too short to describe real behavior
function isPlaceholder(value) {
  if (value === null || value === undefined) return true;
  const v = String(value).trim().toLowerCase();
  if (PLACEHOLDER_TOKENS.has(v)) return true;
  if (v.startsWith("[") && v.endsWith("]")) return true;
  return v.length < 8;
}

// warehouse:method
// responsibility: Reports whether a responsibility reads as a bare identifier name rather than a human-readable description
function isIdentifierLike(value) {
  const v = String(value || "").trim();
  return v.length > 0 && !/\s/.test(v);
}

// warehouse:method
// responsibility: Reports whether a responsibility merges two or more distinct concerns joined into one overloaded clause
function isMergedResponsibility(value) {
  return / and [A-Z]/.test(String(value || ""));
}

// warehouse:method
// responsibility: Scores a file by what fraction of its methods own a distinct, specific, single responsibility, listing the reason each weak method fails
function evaluateFileCoherence(file) {
  const fileResp = (file.file && file.file.responsibility ? file.file.responsibility : "").trim();
  const methods = file.methods || [];
  if (methods.length === 0) {
    return {
      fileResp,
      coherenceScore: 100,
      alignedMethods: 0,
      totalMethods: 0,
      analysisNote: "no_methods_to_validate",
      issues: [],
    };
  }

  const responsibilityOf = (m) => (m.taxonomy && m.taxonomy.responsibility ? m.taxonomy.responsibility : "").trim();

  // Count responsibilities to detect non-distinct siblings.
  const counts = {};
  for (const m of methods) {
    const r = responsibilityOf(m);
    if (r) counts[r] = (counts[r] || 0) + 1;
  }

  let alignedMethods = 0;
  const issues = [];
  for (const method of methods) {
    const resp = responsibilityOf(method);
    const reasons = [];
    if (isPlaceholder(resp)) {
      reasons.push("placeholder_or_too_short");
    } else {
      if (isIdentifierLike(resp)) reasons.push("identifier_not_description");
      if (fileResp && resp === fileResp) reasons.push("copied_from_file");
      if (counts[resp] > 1) reasons.push("duplicate_of_sibling");
      if (isMergedResponsibility(resp)) reasons.push("merged_responsibilities");
    }

    if (reasons.length === 0) {
      alignedMethods += 1;
    } else {
      issues.push({
        method: method.name,
        methodResp: resp,
        reasons,
        isBoilerplate: isBoilerplate(method.name),
      });
    }
  }

  const coherenceScore = Math.round((alignedMethods / methods.length) * 100);
  return { fileResp, coherenceScore, alignedMethods, totalMethods: methods.length, issues };
}

module.exports = { evaluateFileCoherence };
