// warehouse:file
// responsibility: Generates a conventional commit message from a staged-change taxonomy using Gemini Flash
// actor: worker_bee_infrastructure
// role: message_generator
// source_truth: implementation

const fs = require("fs");
const path = require("path");
const { callGeminiJSON, DEFAULT_MODEL } = require("../gemini-modules/json-caller-with-retry");

const ALLOWED_TYPES = new Set(["feat", "fix", "docs", "refactor", "test", "chore", "build", "ci", "perf", "revert"]);

function normalizeSubject(subject) {
  const text = String(subject || "").trim().replace(/\s+/g, " ").replace(/[.]+$/, "");
  if (!text) return "update the staged changes";
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function normalizeScope(scope) {
  const text = String(scope || "").trim().toLowerCase().replace(/[^a-z0-9._/-]+/g, "-").replace(/^-+|-+$/g, "");
  return text || null;
}

function fallbackCommitMessage(taxonomy) {
  const summary = taxonomy.summary || {};
  const surface = summary.surface || {};
  const kind = summary.kind || {};
  const dominantSurface = Object.entries(surface).sort((a, b) => b[1] - a[1])[0]?.[0] || "repo";
  const dominantKind = Object.entries(kind).sort((a, b) => b[1] - a[1])[0]?.[0] || "changes";
  const type =
    dominantKind === "markdown" || dominantSurface === "docs"
      ? "docs"
      : dominantKind === "python" || dominantSurface === "tests"
        ? "test"
        : dominantSurface === "config"
          ? "chore"
          : "feat";
  return {
    type,
    scope: dominantSurface === "repo" ? null : dominantSurface,
    subject: `update ${dominantKind} ${dominantSurface}`.replace(/\s+/g, " "),
    confidence: "low",
    notes: "Fallback generated locally because the model response was unavailable or invalid.",
  };
}

function formatCommitMessage(result, taxonomy) {
  const base = result && typeof result === "object" ? result : fallbackCommitMessage(taxonomy);
  const fallback = fallbackCommitMessage(taxonomy);
  const type = ALLOWED_TYPES.has(base.type) ? base.type : fallback.type;
  const scope = normalizeScope(base.scope);
  const subject = normalizeSubject(base.subject);
  return {
    type,
    scope,
    subject,
    message: `${type}${scope ? `(${scope})` : ""}: ${subject}`,
    confidence: base.confidence || "unknown",
    notes: base.notes || "",
  };
}

function buildPrompt(taxonomy) {
  return [
    "You are Worker B, a Gemini Flash commit-message writer.",
    "Read only the change taxonomy JSON provided below. Do not inspect the filesystem or invent details that are not in the taxonomy.",
    "Return a JSON object with these keys: type, scope, subject, confidence, notes.",
    "Rules:",
    "- type must be one of feat, fix, docs, refactor, test, chore, build, ci, perf, revert.",
    "- scope should be a short lowercase area name or null.",
    "- subject should be imperative, lowercase, and under 72 characters.",
    "- notes should be a short explanation or an empty string.",
    "- Prefer the narrowest accurate scope and the broadest accurate summary.",
    "- Do not mention that you are an AI.",
    "- Do not include markdown fences.",
    "",
    "Change taxonomy JSON:",
    JSON.stringify(taxonomy, null, 2),
  ].join("\n");
}

async function generateCommitMessage(taxonomy, options = {}) {
  const model = options.model || process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const apiKey = options.apiKey || process.env.LOC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const prompt = buildPrompt(taxonomy);
  let raw;

  if (apiKey) {
    try {
      raw = await callGeminiJSON({
        system: "You generate concise conventional commit messages from a change taxonomy.",
        user: prompt,
        apiKey,
        model,
        maxTokens: 1024,
      });
    } catch (_error) {
      raw = null;
    }
  } else {
    raw = null;
  }

  const formatted = formatCommitMessage(raw, taxonomy);
  return {
    ...formatted,
    model,
  };
}

function writeCommitMessageReport(reportRoot, taxonomy, result) {
  const targetDir = path.join(reportRoot, "commit-message", "latest");
  fs.mkdirSync(targetDir, { recursive: true });
  const taxonomyPath = path.join(targetDir, "change-taxonomy.json");
  const reportPath = path.join(targetDir, "generated-commit-message.json");
  const messagePath = path.join(targetDir, "generated-commit-message.txt");
  fs.writeFileSync(taxonomyPath, JSON.stringify(taxonomy, null, 2) + "\n", "utf8");
  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2) + "\n", "utf8");
  fs.writeFileSync(messagePath, result.message + "\n", "utf8");
  return { taxonomyPath, reportPath, messagePath };
}

module.exports = {
  ALLOWED_TYPES,
  buildPrompt,
  fallbackCommitMessage,
  formatCommitMessage,
  generateCommitMessage,
  normalizeScope,
  normalizeSubject,
  writeCommitMessageReport,
};
