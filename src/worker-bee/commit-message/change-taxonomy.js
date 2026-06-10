// warehouse:file
// responsibility: Builds a commit-message change taxonomy from staged git diff data for model reasoning
// actor: worker_bee_infrastructure
// role: taxonomy_builder
// source_truth: implementation

const { execFileSync } = require("child_process");
const path = require("path");

const DEFAULT_MAX_FILES = Number(process.env.COMMIT_MESSAGE_MAX_FILES || 40);
const DEFAULT_MAX_EXCERPT_LINES = Number(process.env.COMMIT_MESSAGE_MAX_EXCERPT_LINES || 120);

const SURFACE_RULES = [
  { surface: "cli", test: (relPath) => relPath.startsWith("cli/") || relPath.startsWith("bin/") },
  { surface: "src", test: (relPath) => relPath.startsWith("src/") },
  { surface: "tests", test: (relPath) => relPath.startsWith("tests/") },
  { surface: "docs", test: (relPath) => relPath.startsWith("docs/") },
  { surface: "scripts", test: (relPath) => relPath.startsWith("scripts/") },
  { surface: "taxonomy", test: (relPath) => relPath.startsWith("taxonomy/") },
  { surface: "packages", test: (relPath) => relPath.startsWith("packages/") },
  { surface: "reports", test: (relPath) => relPath.startsWith("reports/") },
  {
    surface: "config",
    test: (relPath) =>
      /(^|\/)(package\.json|package-lock\.json|\.env(\..+)?|tsconfig\.json|jsconfig\.json|eslint\.config\.|\.gitignore)$/.test(relPath),
  },
];

const KIND_RULES = [
  { kind: "javascript", test: (relPath) => relPath.endsWith(".js") },
  { kind: "json", test: (relPath) => relPath.endsWith(".json") },
  { kind: "markdown", test: (relPath) => relPath.endsWith(".md") },
  { kind: "shell", test: (relPath) => relPath.endsWith(".sh") },
  { kind: "typescript", test: (relPath) => relPath.endsWith(".ts") || relPath.endsWith(".tsx") },
  { kind: "python", test: (relPath) => relPath.endsWith(".py") },
];

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "file",
  "files",
  "path",
  "paths",
  "line",
  "lines",
  "change",
  "changes",
  "update",
  "updated",
  "adds",
  "added",
  "remove",
  "removed",
  "fix",
  "fixed",
  "new",
  "old",
  "when",
  "into",
  "your",
  "you",
  "are",
  "was",
  "its",
  "our",
  "can",
  "will",
  "not",
  "use",
  "used",
  "have",
  "has",
  "had",
  "over",
  "under",
  "than",
  "then",
  "more",
  "less",
  "make",
  "made",
  "commit",
  "message",
  "taxonomy",
]);

function runGit(repoRoot, args) {
  return execFileSync("git", ["-c", "core.quotePath=false", ...args], { cwd: repoRoot, encoding: "utf8" });
}

function safeGit(repoRoot, args) {
  try {
    return runGit(repoRoot, args);
  } catch (error) {
    if (error && typeof error.stdout === "string") {
      return error.stdout;
    }
    throw error;
  }
}

function parseNameStatus(output) {
  const rows = [];
  for (const line of output.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const [status, ...rest] = trimmed.split(/\t/);
    if (/^[RC]\d+$/.test(status) && rest.length >= 2) {
      rows.push({ status: status[0] === "R" ? "renamed" : "copied", score: Number(status.slice(1)), old_path: rest[0], path: rest[1] });
      continue;
    }
    rows.push({ status, path: rest[0] || null, old_path: null, score: null });
  }
  return rows;
}

function parseNumStat(output) {
  const rows = new Map();
  for (const line of output.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const [addedRaw, deletedRaw, ...rest] = trimmed.split(/\t/);
    const pathName = rest.pop();
    if (!pathName) continue;
    rows.set(pathName, {
      additions: addedRaw === "-" ? 0 : Number(addedRaw),
      deletions: deletedRaw === "-" ? 0 : Number(deletedRaw),
    });
  }
  return rows;
}

function splitPatchSections(output) {
  return output
    .replace(/\r\n/g, "\n")
    .split(/^diff --git /m)
    .filter(Boolean)
    .map((section) => `diff --git ${section}`);
}

function tokenize(text) {
  return String(text)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 4 && !STOPWORDS.has(word));
}

function topKeywords(parts, limit = 10) {
  const counts = new Map();
  for (const part of parts) {
    for (const token of tokenize(part)) {
      counts.set(token, (counts.get(token) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([keyword]) => keyword);
}

function classifyPath(relPath) {
  for (const rule of SURFACE_RULES) {
    if (rule.test(relPath)) return rule.surface;
  }
  return "other";
}

function classifyKind(relPath) {
  for (const rule of KIND_RULES) {
    if (rule.test(relPath)) return rule.kind;
  }
  return "other";
}

function classifyRole(file) {
  if (file.surface === "tests") return "test";
  if (file.surface === "docs") return "documentation";
  if (file.surface === "reports") return "report";
  if (file.surface === "taxonomy") return "taxonomy";
  if (file.surface === "scripts") return "automation";
  if (file.surface === "config") return "configuration";
  return "implementation";
}

function summarizeHunks(section) {
  const lines = section.replace(/\r\n/g, "\n").split("\n");
  const header = lines[0] || "";
  const hunks = [];
  let current = null;

  for (const line of lines.slice(1)) {
    if (line.startsWith("@@")) {
      if (current) hunks.push(current);
      current = { header: line, added: 0, deletions: 0, context: [] };
      continue;
    }
    if (!current) continue;
    if (line.startsWith("+") && !line.startsWith("+++")) {
      current.added += 1;
      if (current.context.length < 4) current.context.push(line.slice(1).trim());
    } else if (line.startsWith("-") && !line.startsWith("---")) {
      current.deletions += 1;
      if (current.context.length < 4) current.context.push(line.slice(1).trim());
    }
  }

  if (current) hunks.push(current);
  const excerptLines = [];
  for (const hunk of hunks) {
    for (const line of hunk.context) {
      if (!line) continue;
      excerptLines.push(line);
      if (excerptLines.length >= 12) break;
    }
    if (excerptLines.length >= 12) break;
  }

  return {
    header,
    hunk_count: hunks.length,
    added_lines: hunks.reduce((total, hunk) => total + hunk.added, 0),
    deleted_lines: hunks.reduce((total, hunk) => total + hunk.deletions, 0),
    excerpt_lines: excerptLines,
    hunk_context: hunks.map((hunk) => hunk.header.replace(/^@@\s*/, "").trim()).filter(Boolean),
  };
}

function aggregate(rows) {
  return rows.reduce(
    (totals, file) => {
      totals.files += 1;
      totals.additions += file.additions;
      totals.deletions += file.deletions;
      totals.hunks += file.hunk_count;
      totals.status[file.status] = (totals.status[file.status] || 0) + 1;
      totals.surface[file.surface] = (totals.surface[file.surface] || 0) + 1;
      totals.kind[file.kind] = (totals.kind[file.kind] || 0) + 1;
      for (const keyword of file.keywords) {
        totals.keywords[keyword] = (totals.keywords[keyword] || 0) + 1;
      }
      return totals;
    },
    { files: 0, additions: 0, deletions: 0, hunks: 0, status: {}, surface: {}, kind: {}, keywords: {} }
  );
}

function buildChangeTaxonomy(repoRoot, options = {}) {
  const maxFiles = Number.isFinite(options.maxFiles) ? options.maxFiles : DEFAULT_MAX_FILES;
  const maxExcerptLines = Number.isFinite(options.maxExcerptLines) ? options.maxExcerptLines : DEFAULT_MAX_EXCERPT_LINES;

  const diffSummary = safeGit(repoRoot, ["diff", "--cached", "--name-status", "--find-renames", "--find-copies"]);
  const nameStatus = parseNameStatus(diffSummary);
  const numStat = parseNumStat(safeGit(repoRoot, ["diff", "--cached", "--numstat", "--find-renames", "--find-copies"]));
  const patch = safeGit(repoRoot, ["diff", "--cached", "--unified=0", "--find-renames", "--find-copies", "--no-color"]);
  const sections = splitPatchSections(patch);

  const sectionByPath = new Map();
  for (const section of sections) {
    const header = section.split(/\n/, 1)[0] || "";
    const match = header.match(/^diff --git a\/(.+) b\/(.+)$/);
    if (!match) continue;
    sectionByPath.set(match[2], summarizeHunks(section));
  }

  const files = nameStatus.map((row) => {
    const relPath = row.path || row.old_path;
    const stats = numStat.get(relPath) || numStat.get(row.old_path || "") || { additions: 0, deletions: 0 };
    const patchSummary = sectionByPath.get(relPath) || sectionByPath.get(row.old_path || "") || {
      header: "",
      hunk_count: 0,
      added_lines: stats.additions,
      deleted_lines: stats.deletions,
      excerpt_lines: [],
      hunk_context: [],
    };
    const file = {
      path: relPath,
      old_path: row.old_path || null,
      new_path: row.status === "renamed" ? row.path : null,
      status: row.status,
      score: row.score,
      surface: classifyPath(relPath),
      kind: classifyKind(relPath),
      role: null,
      additions: stats.additions,
      deletions: stats.deletions,
      hunk_count: patchSummary.hunk_count,
      excerpt_lines: patchSummary.excerpt_lines.slice(0, Math.max(0, maxExcerptLines)),
      hunk_context: patchSummary.hunk_context,
    };
    file.role = classifyRole(file);
    file.keywords = topKeywords([file.path, file.surface, file.kind, file.role, ...file.excerpt_lines], 8);
    return file;
  });

  const rankedFiles = [...files].sort((a, b) => (b.additions + b.deletions) - (a.additions + a.deletions) || a.path.localeCompare(b.path));
  const sampledFiles = rankedFiles.slice(0, maxFiles);
  const omittedFiles = rankedFiles.slice(maxFiles);
  const sampledSummary = aggregate(sampledFiles);
  const omittedSummary = aggregate(omittedFiles);
  const topWords = Object.entries(sampledSummary.keywords)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 12)
    .map(([word]) => word);

  return {
    schema: "commit-message-taxonomy.v1",
    repo_root: path.resolve(repoRoot),
    generated_at: new Date().toISOString(),
    diff_source: "git diff --cached",
    summary: {
      files: sampledSummary.files,
      total_files: files.length,
      sampled_files: sampledFiles.length,
      omitted_files: omittedFiles.length,
      additions: sampledSummary.additions,
      deletions: sampledSummary.deletions,
      hunks: sampledSummary.hunks,
      status: sampledSummary.status,
      surface: sampledSummary.surface,
      kind: sampledSummary.kind,
      keywords: topWords,
      omitted_summary:
        omittedFiles.length > 0
          ? {
              files: omittedSummary.files,
              additions: omittedSummary.additions,
              deletions: omittedSummary.deletions,
              status: omittedSummary.status,
              surface: omittedSummary.surface,
              kind: omittedSummary.kind,
            }
          : null,
    },
    files: sampledFiles,
  };
}

module.exports = {
  buildChangeTaxonomy,
  classifyKind,
  classifyPath,
  classifyRole,
  parseNameStatus,
  parseNumStat,
  splitPatchSections,
  summarizeHunks,
  topKeywords,
};
