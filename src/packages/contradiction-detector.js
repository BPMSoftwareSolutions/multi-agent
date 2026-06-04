// warehouse:file
// responsibility: Aggregates files into package groups with role/actor distributions
// actor: package_classifier
// role: analyzer
// source_truth: implementation

// warehouse:method
// responsibility: Aggregates files into package groups with role/actor distributions
// actor: package_classifier
// role: analyzer
// source_truth: implementation
function analyzePackages(taxonomyPath) {
  const fs = require("fs");
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

    packages[pkgName].files.push(file);
    packages[pkgName].roles[file.role] = (packages[pkgName].roles[file.role] || 0) + 1;
    packages[pkgName].actors[file.actor] = (packages[pkgName].actors[file.actor] || 0) + 1;

    if (file.responsibility && file.responsibility.length > 5) {
      packages[pkgName].responsibilities.push(file.responsibility);
    }
  }

  return packages;
}

// warehouse:method
// responsibility: Detects contradictions in package taxonomy by checking name-responsibility mismatches and role inconsistency
// actor: contradiction_detector
// role: validator
// source_truth: implementation
function detectContradictions(pkg) {
  const issues = [];

  const hasDataAccessRole = pkg.roles["data_access"] > 0;
  const hasOtherDomainResponsibilities = pkg.responsibilities.some(r =>
    r.match(/export|validate|service|orchestration|projection|execute|compile/i)
  );

  if (!hasDataAccessRole && hasOtherDomainResponsibilities) {
    issues.push({
      type: "NAME_RESPONSIBILITY_MISMATCH",
      severity: "HIGH",
      message: `Package named "*-stores" but responsibilities suggest non-data-access role`,
      details: `Name: ${pkg.name} | Found responsibilities: ${pkg.responsibilities.slice(0, 2).join(", ")}`
    });
  }

  const roleEntries = Object.entries(pkg.roles);
  if (roleEntries.length > 3) {
    issues.push({
      type: "ROLE_INCONSISTENCY",
      severity: "MEDIUM",
      message: `Package has ${roleEntries.length} different roles (should be 1-2)`,
      details: `Roles: ${roleEntries.map(([r, c]) => `${r}(${c})`).join(", ")}`
    });
  }

  const suspiciousResponsibilities = pkg.responsibilities.filter(r =>
    r.match(/^(__init__|noqa:|test_|\.py$|source_module|module$)/i) ||
    r.includes("F401") || r.includes("F403")
  );

  if (suspiciousResponsibilities.length > pkg.files.length * 0.3) {
    issues.push({
      type: "UNCLEAR_RESPONSIBILITIES",
      severity: "MEDIUM",
      message: `${suspiciousResponsibilities.length}/${pkg.files.length} files have unclear/placeholder responsibilities`,
      details: `Examples: ${suspiciousResponsibilities.slice(0, 2).join(" | ")}`
    });
  }

  const uniqueResponsibilities = new Set(pkg.responsibilities.map(r =>
    r.split(/[_\s]+/)[0]
  )).size;

  if (uniqueResponsibilities > pkg.files.length * 0.5) {
    issues.push({
      type: "DOMAIN_FRAGMENTATION",
      severity: "LOW",
      message: `Package lacks semantic cohesion (${uniqueResponsibilities} distinct responsibility domains across ${pkg.files.length} files)`,
      details: `Files may belong in separate packages`
    });
  }

  const actorEntries = Object.entries(pkg.actors);
  if (actorEntries.length > 2) {
    issues.push({
      type: "ACTOR_MISMATCH",
      severity: "LOW",
      message: `Package has files owned by ${actorEntries.length} different actors`,
      details: `Actors: ${actorEntries.map(([a, c]) => `${a}(${c})`).join(", ")}`
    });
  }

  return issues;
}

module.exports = { analyzePackages, detectContradictions };
