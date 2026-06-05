const fs = require("fs");
const path = require("path");

function markdownValue(value) {
  if (value === null || typeof value === "undefined" || value === "") {
    return "_Pending_";
  }
  return String(value).replace(/\|/g, "\\|");
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.map(markdownValue).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(markdownValue).join(" | ")} |`),
  ].join("\n");
}

function resolveEvidencePath(rootDir, evidence) {
  if (!evidence || typeof evidence !== "string") {
    return null;
  }
  return path.isAbsolute(evidence) ? evidence : path.resolve(rootDir, evidence);
}

function evidenceArtifactStatus(rootDir, scenario) {
  if (!scenario.evidence) {
    return {
      status: "declared_not_executed",
      evidence_path: null,
      evidence_exists: false,
      evidence_summary: null,
    };
  }

  const evidencePath = resolveEvidencePath(rootDir, scenario.evidence);
  if (!evidencePath || !fs.existsSync(evidencePath) || !fs.statSync(evidencePath).isFile()) {
    return {
      status: "evidence_missing",
      evidence_path: evidencePath,
      evidence_exists: false,
      evidence_summary: "evidence artifact missing",
    };
  }

  const raw = fs.readFileSync(evidencePath, "utf8").trim();
  const summary = raw.length > 240 ? `${raw.slice(0, 237)}...` : raw;
  const textMatch = raw.includes(scenario.id) || raw.includes(scenario.name);
  return {
    status: textMatch ? "evidence_provided" : "evidence_unverified",
    evidence_path: evidencePath,
    evidence_exists: true,
    evidence_summary: summary,
  };
}

function implementationFileStatus(rootDir, filePath) {
  const absolute = path.isAbsolute(filePath) ? filePath : path.resolve(rootDir, filePath);
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) {
    return {
      status: "missing",
      absolute_path: absolute,
    };
  }
  return {
    status: "present",
    absolute_path: absolute,
  };
}

function collectBlockingGates(report) {
  const blocking = [];
  if (!report.validation.valid) {
    blocking.push("manifest_validation");
  }
  if (report.acceptance.status !== "pass") {
    blocking.push("acceptance");
  }
  if (report.implementation_trace.status !== "pass") {
    blocking.push("implementation_trace");
  }
  for (const [gate, status] of Object.entries(report.coherence)) {
    if (status !== "pass") {
      blocking.push(gate);
    }
  }
  if (report.learning.status !== "pass") {
    blocking.push("learning_record");
  }
  return [...new Set(blocking)];
}

function formatGateLabel(status) {
  if (status === "pass") return "pass";
  if (status === "unknown") return "unknown";
  if (status === "review_required") return "review_required";
  if (status === "blocked") return "blocked";
  return String(status || "unknown");
}

function formatAcceptanceScenarios(acceptance) {
  const rows = acceptance.scenarios.map((scenario) => [
    scenario.id,
    scenario.name,
    scenario.status,
    scenario.evidence_path || scenario.test_command || "_Pending_",
    scenario.expected_result || "_Pending_",
  ]);
  return markdownTable(["Scenario", "Name", "Status", "Evidence", "Expected"], rows);
}

function formatChangedFiles(implementationTrace) {
  const rows = implementationTrace.changed_files.map((file) => [
    file.path,
    file.reason,
    file.value_link,
    file.acceptance_links.join(", "),
  ]);
  return markdownTable(["Path", "Reason", "Value Link", "Acceptance Links"], rows);
}

function formatCoherenceTable(coherence) {
  return markdownTable(
    ["Gate", "Status"],
    [
      ["local_taxonomy", formatGateLabel(coherence.local_taxonomy)],
      ["filesystem_story", formatGateLabel(coherence.filesystem_story)],
      ["readme_alignment", formatGateLabel(coherence.readme_alignment)],
      ["canonical_residue", formatGateLabel(coherence.canonical_residue)],
      ["file_economy", formatGateLabel(coherence.file_economy)],
    ]
  );
}

function formatBlockingGates(report) {
  if (report.blocking_gates.length === 0) {
    return "_None_";
  }
  return report.blocking_gates.map((gate) => `- ${gate}`).join("\n");
}

function formatDeliveryReadinessMarkdown(report) {
  return [
    `# Delivery Readiness: ${report.delivery_id}`,
    "",
    `Status: **${report.status}**`,
    "",
    "## Delivery Summary",
    "",
    markdownTable(
      ["Field", "Value"],
      [
        ["Story ID", report.intent.story_id],
        ["Actor", report.intent.actor],
        ["Need", report.intent.need],
        ["Value", report.intent.value],
        ["Generated", report.generated_at],
      ]
    ),
    "",
    "## Acceptance Evidence",
    "",
    `Status: **${report.acceptance.status}**`,
    "",
    formatAcceptanceScenarios(report.acceptance),
    "",
    "## Implementation Trace",
    "",
    `Status: **${report.implementation_trace.status}**`,
    "",
    formatChangedFiles(report.implementation_trace),
    "",
    "## Coherence Gates",
    "",
    formatCoherenceTable(report.coherence),
    "",
    "## Blocking Gates",
    "",
    formatBlockingGates(report),
    "",
    "## Learning Record",
    "",
    markdownTable(
      ["Field", "Value"],
      [
        ["Status", report.learning.status],
        ["Record Path", report.learning.record_path],
        ["Future Regressions", report.learning.future_regressions.length ? report.learning.future_regressions.join("; ") : "_None_"],
      ]
    ),
    "",
    "## Release Decision",
    "",
    report.status === "release_ready"
      ? "This delivery is ready to release."
      : "This delivery is not ready to release yet. The blocking gates above must be resolved first.",
    "",
  ].join("\n");
}

function buildDeliveryReadinessReport(input) {
  const validation = input.validation || { valid: false, errors: ["missing validation result"] };
  const rootDir = input.rootDir || process.cwd();
  const acceptanceScenarios = (input.manifest.acceptance?.scenarios || []).map((scenario) => {
    const artifact = evidenceArtifactStatus(rootDir, scenario);
    return {
      id: scenario.id,
      name: scenario.name,
      status: artifact.status,
      test_command: scenario.test_command || null,
      evidence: scenario.evidence || null,
      evidence_path: artifact.evidence_path,
      evidence_exists: artifact.evidence_exists,
      evidence_summary: artifact.evidence_summary,
      expected_result: scenario.expected_result || null,
    };
  });
  const acceptanceStatus = acceptanceScenarios.length && acceptanceScenarios.every((scenario) => scenario.status === "evidence_provided")
    ? "pass"
    : acceptanceScenarios.some((scenario) => scenario.status === "evidence_missing" || scenario.status === "evidence_unverified")
      ? "review_required"
      : "declared_not_executed";

  const changedFiles = (input.manifest.implementation?.changed_files || []).map((file) => {
    const fileStatus = implementationFileStatus(rootDir, file.path);
    return {
      path: file.path,
      absolute_path: fileStatus.absolute_path,
      exists: fileStatus.status === "present",
      status: fileStatus.status === "present" ? "present" : "missing",
      reason: file.reason,
      value_link: file.value_link,
      acceptance_links: Array.isArray(file.acceptance_links) ? file.acceptance_links.slice() : [],
    };
  });

  const storyCheck = input.storyCheck || null;
  const gates = storyCheck?.gates || {};
  const coherence = {
    local_taxonomy: gates.localTaxonomy === "pass" ? "pass" : (gates.localTaxonomy || "unknown"),
    filesystem_story: gates.filesystemStory === "pass" ? "pass" : (gates.filesystemStory || "unknown"),
    readme_alignment: gates.readmeAlignment === "pass" ? "pass" : (gates.readmeAlignment || "unknown"),
    canonical_residue: gates.canonicalResidue === "pass" ? "pass" : (gates.canonicalResidue || "unknown"),
    file_economy: gates.fileEconomy === "pass" ? "pass" : (gates.fileEconomy || "unknown"),
  };

  const learningExists = input.learningRecord && typeof input.learningRecord === "object";
  const learningStatus = learningExists ? "pass" : "review_required";
  const report = {
    schema: "loc-delivery-readiness-report.v1",
    delivery_id: input.manifest.delivery_id,
    generated_at: new Date().toISOString(),
    status: "review_required",
    validation: {
      valid: validation.valid,
      errors: validation.errors || [],
    },
    intent: {
      story_id: input.manifest.intent.story_id,
      actor: input.manifest.intent.actor,
      need: input.manifest.intent.need,
      value: input.manifest.intent.value,
    },
    acceptance: {
      status: acceptanceStatus,
      scenario_count: acceptanceScenarios.length,
      scenarios: acceptanceScenarios,
    },
    implementation_trace: {
      status: validation.valid && changedFiles.every((file) => file.exists) ? "pass" : "blocked",
      changed_files: changedFiles,
    },
    story_check: storyCheck
      ? {
          status: storyCheck.status,
          exitCode: storyCheck.exitCode,
          gates: storyCheck.gates,
          readme: storyCheck.readme,
        }
      : {
          status: "unknown",
          exitCode: 1,
          gates: {
            localTaxonomy: "unknown",
            filesystemStory: "unknown",
            readmeAlignment: "unknown",
            canonicalResidue: "unknown",
            fileEconomy: "unknown",
          },
          readme: { stale: true, staleCount: 1, rows: [] },
        },
    coherence,
    learning: {
      status: learningStatus,
      record_path: input.manifest.learning.record_path,
      future_regressions: Array.isArray(input.manifest.learning.future_regressions)
        ? input.manifest.learning.future_regressions.slice()
        : [],
    },
    blocking_gates: [],
    sources: {
      scan_report: input.scanPath || null,
      story_review: input.storyReviewPath || null,
      readme: input.readmePath || null,
    },
  };

  report.blocking_gates = collectBlockingGates(report);
  if (!validation.valid) {
    report.status = "release_blocked";
  } else if (changedFiles.some((file) => !file.exists)) {
    report.status = "release_blocked";
  } else if (acceptanceScenarios.some((scenario) => scenario.status === "evidence_missing" || scenario.status === "evidence_unverified")) {
    report.status = "release_blocked";
  } else if (report.blocking_gates.length === 0) {
    report.status = "release_ready";
  } else if (!storyCheck) {
    report.status = "review_required";
  } else if (report.acceptance.status !== "pass" || report.learning.status !== "pass") {
    report.status = "release_blocked";
  } else if (Object.values(coherence).some((status) => status === "unknown")) {
    report.status = "review_required";
  } else {
    report.status = "release_blocked";
  }

  return report;
}

function writeDeliveryReadinessReport(rootDir, report, options = {}) {
  const reportsDir = path.resolve(rootDir, options.reportsDir || "reports");
  const deliveryDir = path.join(reportsDir, "delivery-readiness", report.delivery_id);
  fs.mkdirSync(deliveryDir, { recursive: true });
  fs.mkdirSync(path.join(reportsDir, "delivery-readiness"), { recursive: true });

  const jsonPath = path.join(deliveryDir, "readiness.json");
  const mdPath = path.join(deliveryDir, "readiness.md");
  const latestJsonPath = path.join(reportsDir, "delivery-readiness", "latest.json");
  const latestMdPath = path.join(reportsDir, "DELIVERY-READINESS-LATEST.md");

  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(mdPath, `${formatDeliveryReadinessMarkdown(report)}\n`, "utf8");
  fs.writeFileSync(latestJsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(latestMdPath, `${formatDeliveryReadinessMarkdown(report)}\n`, "utf8");

  return {
    jsonPath,
    mdPath,
    latestJsonPath,
    latestMdPath,
  };
}

module.exports = {
  buildDeliveryReadinessReport,
  formatDeliveryReadinessMarkdown,
  writeDeliveryReadinessReport,
};
