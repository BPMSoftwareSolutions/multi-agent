// warehouse:file
// responsibility: Render an honest coherence issue as reason-based text instead of the retired similarity score
// actor: coherence_analyzer
// role: analyzer
// source_truth: implementation

// warehouse:method
// responsibility: Turn a coherence issue into a single human-readable clause naming why the method responsibility is not honest
function formatCoherenceIssue(issue) {
  if (!issue || !issue.method) return "";
  const reasons = Array.isArray(issue.reasons) && issue.reasons.length ? issue.reasons.join(", ") : "incoherent_responsibility";
  return `${issue.method}: ${reasons}`;
}

module.exports = { formatCoherenceIssue };
