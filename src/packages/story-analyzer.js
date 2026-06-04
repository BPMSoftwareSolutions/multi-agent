// warehouse:file
// responsibility: Extracts unique package responsibilities and synthesizes package story narratives
// actor: story_generator
// role: analyzer
// source_truth: implementation

const fs = require("fs");

// warehouse:method
// responsibility: undefined
// actor: undefined
// role: undefined
// source_truth: implementation

function analyzePackageStories(taxonomyPath) {
  const taxonomy = JSON.parse(fs.readFileSync(taxonomyPath, "utf8"));
  const packages = {};
  for (const file of taxonomy.files) {
    const match = file.path.match(/^packages\/([^/]+)\//);
    if (!match) continue;

    const pkgName = match[1];
    if (!packages[pkgName]) {
      packages[pkgName] = {
        name: pkgName,
        files: [],
        responsibilities: [],
        roles: {},
        actors: {}
      };
    }

    packages[pkgName].files.push({
      path: file.path,
      role: file.role,
      responsibility: file.responsibility,
      actor: file.actor
    });

    if (file.responsibility &&
        !file.responsibility.match(/^(__init__|noqa:|src\/|test_|\.py$)/i) &&
        file.responsibility.length > 5) {
      if (!packages[pkgName].responsibilities.includes(file.responsibility)) {
        packages[pkgName].responsibilities.push(file.responsibility);
      }
    }

    packages[pkgName].roles[file.role] = (packages[pkgName].roles[file.role] || 0) + 1;
    packages[pkgName].actors[file.actor] = (packages[pkgName].actors[file.actor] || 0) + 1;
  }

  return packages;
}

// warehouse:method
// responsibility: undefined
// actor: undefined
// role: undefined
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

module.exports = { analyzePackageStories, generateStory };
