#!/usr/bin/env node
// Package story analyzer: read the taxonomy report and extract what each package does
// from the aggregated responsibilities of its files.

const fs = require("fs");
const path = require("path");

function analyzePackageStories(taxonomyPath) {
  const taxonomy = JSON.parse(fs.readFileSync(taxonomyPath, "utf8"));

  // Group files by package name
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

    // Aggregate unique responsibilities (filter out noise)
    if (file.responsibility &&
        !file.responsibility.match(/^(__init__|noqa:|src\/|test_|\.py$)/i) &&
        file.responsibility.length > 5) {
      if (!packages[pkgName].responsibilities.includes(file.responsibility)) {
        packages[pkgName].responsibilities.push(file.responsibility);
      }
    }

    // Track roles
    packages[pkgName].roles[file.role] = (packages[pkgName].roles[file.role] || 0) + 1;

    // Track actors
    packages[pkgName].actors[file.actor] = (packages[pkgName].actors[file.actor] || 0) + 1;
  }

  return packages;
}

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

const taxonomyPath = path.resolve(__dirname, "..", "reports", "taxonomy-packages.json");
if (!fs.existsSync(taxonomyPath)) {
  console.error(`Taxonomy report not found: ${taxonomyPath}`);
  console.error("Run: node bin/taxonomy-report.js --output reports/taxonomy-packages.json");
  process.exit(1);
}

const packages = analyzePackageStories(taxonomyPath);
const stories = Object.values(packages)
  .map(generateStory)
  .sort((a, b) => a.package.localeCompare(b.package));

// Output as JSON
const report = {
  generated_at: new Date().toISOString(),
  total_packages: stories.length,
  packages_with_stories: stories.filter(s => s.story !== "(responsibilities need clarity)").length,
  stories
};

console.log(JSON.stringify(report, null, 2));
