// warehouse:file
// responsibility: Groups files by package, collects unique responsibilities and role distributions
// actor: story_generator
// role: analyzer
// source_truth: implementation

const fs = require("fs");

// warehouse:method
// responsibility: Groups files by package, collects unique responsibilities and role distributions
// actor: method_implementation
// role: implementation
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

module.exports = { analyzePackageStories };
