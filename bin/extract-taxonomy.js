#!/usr/bin/env node
// warehouse:file
// responsibility: Taxonomy extractor: walks JavaScript files, parses file and method taxonomy headers, validates field presence, aggregates into JSON structure, writes reports and summary
// actor: taxonomy_extractor
// role: data_exporter
// source_truth: implementation

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

// warehouse:method
// responsibility: Recursively traverses directory tree and collects all JavaScript file paths
// actor: file_scanner
// role: traverser
// source_truth: implementation
function walk(dir) {
  const files = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...walk(fullPath));
      } else if (entry.isFile() && entry.name.endsWith(".js")) {
        files.push(fullPath);
      }
    }
  } catch (_e) {
    /* skip */
  }
  return files;
}

// warehouse:method
// responsibility: Extracts warehouse:file header from JavaScript file into a key-value object
// actor: header_parser
// role: extractor
// source_truth: implementation
function extractFileHeader(content) {
  const lines = content.split("\n");
  const header = {};
  let foundFileHeader = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#!") || !trimmed) continue;
    if (!trimmed.startsWith("//")) break;

    // Parse warehouse:X field
    const match = trimmed.match(/^\/\/\s*(\w+):(.*)$/);
    if (match) {
      const key = match[1];
      const value = match[2].trim();
      header[key] = value;

      if (key === "warehouse" && value === "file") {
        foundFileHeader = true;
      }
    }
  }

  return foundFileHeader ? header : {};
}

// warehouse:method
// responsibility: Extracts all warehouse:method headers from JavaScript file into an array of method taxonomies
// actor: header_parser
// role: extractor
// source_truth: implementation
function extractMethodHeaders(content) {
  const lines = content.split("\n");
  const methods = [];
  let currentMethod = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check if this is a method header start
    if (trimmed.match(/^\/\/\s*warehouse:\s*method/)) {
      currentMethod = { name: null, taxonomy: { warehouse: "method" } };
      continue;
    }

    // Collect taxonomy lines for current method
    if (currentMethod && trimmed.startsWith("//")) {
      const match = trimmed.match(/^\/\/\s*(\w+):\s*(.*)$/);
      if (match && match[1] !== "warehouse") {
        currentMethod.taxonomy[match[1]] = match[2].trim();
      }
    }

    // Check for function definition after method header
    if (
      currentMethod &&
      (trimmed.startsWith("function ") ||
        trimmed.startsWith("const ") ||
        trimmed.startsWith("async "))
    ) {
      // Extract function name from various patterns
      let nameMatch = trimmed.match(/function\s+(\w+)/);
      if (!nameMatch) nameMatch = trimmed.match(/const\s+(\w+)/);
      if (!nameMatch) nameMatch = trimmed.match(/async\s+(\w+)/);

      if (nameMatch) {
        currentMethod.name = nameMatch[1];
        methods.push(currentMethod);
        currentMethod = null;
      }
    }
  }

  return methods;
}

// warehouse:method
// responsibility: Validates that taxonomy object contains required warehouse, responsibility, actor, and role fields
// actor: taxonomy_validator
// role: validator
// source_truth: implementation
function isValidTaxonomy(taxonomy) {
  const required = ["warehouse", "responsibility", "actor", "role"];
  return required.every((field) => field in taxonomy && taxonomy[field]);
}

// warehouse:method
// responsibility: Processes a JavaScript file and extracts both file-level and method-level taxonomy with validation
// actor: taxonomy_extractor
// role: processor
// source_truth: implementation
function extractFromFile(filePath, root) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const relPath = path.relative(root, filePath).replace(/\\/g, "/");

    const fileHeader = extractFileHeader(content);
    const methods = extractMethodHeaders(content);

    if (!isValidTaxonomy(fileHeader)) {
      return null;
    }

    return {
      path: relPath,
      file: fileHeader,
      methods: methods.filter((m) => isValidTaxonomy(m.taxonomy)),
      totalMethods: methods.length,
      documentedMethods: methods.filter((m) => isValidTaxonomy(m.taxonomy)).length,
    };
  } catch (_e) {
    return null;
  }
}

// warehouse:method
// responsibility: Generates comprehensive JSON report of all extracted taxonomies with summary statistics
// actor: report_generator
// role: reporter
// source_truth: implementation
function generateReport(fileData) {
  const report = {
    generated: new Date().toISOString(),
    summary: {
      totalFiles: fileData.length,
      totalMethods: fileData.reduce((sum, f) => sum + f.totalMethods, 0),
      documentedMethods: fileData.reduce((sum, f) => sum + f.documentedMethods, 0),
      methodCoverage: 0,
    },
    files: fileData,
  };

  if (report.summary.totalMethods > 0) {
    report.summary.methodCoverage = Math.round(
      (report.summary.documentedMethods / report.summary.totalMethods) * 100
    );
  }

  return report;
}

// warehouse:method
// responsibility: Orchestrates extraction of all taxonomy from JavaScript files and outputs to JSON file and console
// actor: taxonomy_extractor
// role: orchestrator
// source_truth: implementation
function main() {
  console.log("📖 Extracting Taxonomy from JavaScript Files\n");

  const binFiles = walk(path.join(root, "bin"));
  const srcFiles = walk(path.join(root, "src"));
  const allFiles = [...binFiles, ...srcFiles].sort();

  console.log(`Found ${allFiles.length} JavaScript files\n`);

  const extracted = [];
  for (const filePath of allFiles) {
    const data = extractFromFile(filePath, root);
    if (data) {
      extracted.push(data);
      const methodStr =
        data.documentedMethods === data.totalMethods
          ? `✅ ${data.documentedMethods}/${data.totalMethods}`
          : `⚠️  ${data.documentedMethods}/${data.totalMethods}`;
      console.log(`${data.path.padEnd(50)} ${methodStr} methods`);
    }
  }

  const report = generateReport(extracted);

  // Ensure reports directory exists
  const reportsDir = path.join(root, "reports");
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const reportPath = path.join(reportsDir, "taxonomy-extracted.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");

  console.log("\n═════════════════════════════════════════════════════════════════════════");
  console.log("EXTRACTION SUMMARY");
  console.log("═════════════════════════════════════════════════════════════════════════\n");
  console.log(`Files with taxonomy:        ${extracted.length}/${allFiles.length}`);
  console.log(`Total methods found:        ${report.summary.totalMethods}`);
  console.log(`Methods with taxonomy:      ${report.summary.documentedMethods}`);
  console.log(`Method coverage:            ${report.summary.methodCoverage}%`);
  console.log(`\nExtracted to:               ${reportPath}`);
  console.log("═════════════════════════════════════════════════════════════════════════");
}

main();
