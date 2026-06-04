// warehouse:file
// responsibility: Formats package narratives with dominant roles and responsibility summaries
// actor: story_generator
// role: formatter
// source_truth: implementation

// warehouse:method
// responsibility: Selects dominant role/actor and formats package narrative summary
// actor: method_implementation
// role: implementation
// source_truth: implementation
function generateStory(pkg) {
  const topRole = Object.entries(pkg.roles).sort((a, b) => b[1] - a[1])[0];
  const topActor = Object.entries(pkg.actors).sort((a, b) => b[1] - a[1])[0];

  const responsibilities = pkg.responsibilities
    .filter(r => r.length > 8)
    .slice(0, 5)
    .join("\n  - ");

  return {
    package: pkg.name,
    files: pkg.files.length,
    topRole: topRole ? topRole[0] : "unknown",
    topActor: topActor ? topActor[0] : "unknown",
    story: responsibilities || "(responsibilities need clarity)"
  };
}

module.exports = { generateStory };
