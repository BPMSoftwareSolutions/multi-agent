#!/usr/bin/env node
/**
 * Anchor Updater Script
 *
 * Reads expected-taxonomy.json and updates all files with new taxonomy anchors.
 * Updates both file-level and method-level warehouse comments.
 *
 * Usage: node scripts/update-anchors.js [path/to/expected-taxonomy.json]
 * Default: reports/taxonomy-extracted.json (or --from flag)
 */

const fs = require("fs");
const path = require("path");

// Configuration
const DEFAULT_TAXONOMY_PATH = path.resolve(__dirname, "..", "reports", "taxonomy-extracted.json");
const PROJECT_ROOT = path.resolve(__dirname, "..");

/**
 * Parse command-line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  let taxonomyPath = DEFAULT_TAXONOMY_PATH;
  let dryRun = false;
  let verbose = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--from" && args[i + 1]) {
      taxonomyPath = path.resolve(PROJECT_ROOT, args[i + 1]);
      i++;
    } else if (args[i] === "--dry-run") {
      dryRun = true;
    } else if (args[i] === "--verbose") {
      verbose = true;
    } else if (args[i] === "--help") {
      printHelp();
      process.exit(0);
    } else if (!args[i].startsWith("--")) {
      // Positional argument
      taxonomyPath = path.resolve(PROJECT_ROOT, args[i]);
    }
  }

  return { taxonomyPath, dryRun, verbose };
}

function printHelp() {
  console.log(`
Anchor Updater - Update taxonomy anchors in source files

Usage: node scripts/update-anchors.js [options] [taxonomy-file]

Options:
  --from <path>       Path to taxonomy JSON file (relative to project root)
  --dry-run          Show what would change without modifying files
  --verbose          Show detailed progress for each file
  --help             Show this help message

Examples:
  node scripts/update-anchors.js
  node scripts/update-anchors.js --from reports/taxonomy-extracted.json
  node scripts/update-anchors.js --dry-run
  node scripts/update-anchors.js reports/custom-taxonomy.json --verbose
  `);
}

/**
 * Load and validate taxonomy file
 */
function loadTaxonomy(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Taxonomy file not found: ${filePath}`);
  }

  try {
    const content = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(content);

    if (!data.files || !Array.isArray(data.files)) {
      throw new Error("Invalid taxonomy format: missing 'files' array");
    }

    return data;
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error(`Invalid JSON in taxonomy file: ${err.message}`);
    }
    throw err;
  }
}

/**
 * Build taxonomy index for fast lookup
 */
function buildTaxonomyIndex(taxonomy) {
  const index = {};

  for (const fileEntry of taxonomy.files) {
    const normalizedPath = path.normalize(fileEntry.path);
    // Handle nested file object structure (from extracted taxonomy format)
    const fileData = fileEntry.file || fileEntry;

    // Convert methods from array format to object format
    let methodsIndex = {};
    if (Array.isArray(fileEntry.methods)) {
      for (const method of fileEntry.methods) {
        const methodTaxonomy = method.taxonomy || method;
        methodsIndex[method.name] = {
          responsibility: methodTaxonomy.responsibility,
          actor: methodTaxonomy.actor,
          role: methodTaxonomy.role,
          source_truth: methodTaxonomy.source_truth || "implementation",
        };
      }
    } else if (typeof fileEntry.methods === 'object') {
      methodsIndex = fileEntry.methods;
    }

    index[normalizedPath] = {
      file: {
        responsibility: fileData.responsibility,
        actor: fileData.actor,
        role: fileData.role,
        source_truth: fileData.source_truth || "implementation",
      },
      methods: methodsIndex,
    };
  }

  return index;
}

/**
 * Parse warehouse:file header from file content
 */
function parseFileHeader(content) {
  const lines = content.split("\n");
  const headerLines = [];
  let endIdx = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip shebang
    if (i === 0 && line.startsWith("#!")) {
      headerLines.push(lines[i]);
      continue;
    }

    // Match warehouse:file comment
    if (line.startsWith("//") && (line.includes("warehouse:file") || line.includes("responsibility:") || line.includes("actor:") || line.includes("role:") || line.includes("source_truth:"))) {
      headerLines.push(lines[i]);
      endIdx = i + 1;
    } else if (line === "" && headerLines.length > 0 && i === endIdx) {
      // Blank line after header
      headerLines.push(lines[i]);
      endIdx = i + 1;
      break;
    } else if (headerLines.length > 0 && !line.startsWith("//")) {
      // End of header reached
      break;
    }
  }

  return {
    lines: headerLines,
    startIdx: 0,
    endIdx: endIdx,
  };
}

/**
 * Generate warehouse:file comment block
 */
function generateFileHeader(fileData) {
  const lines = [
    "// warehouse:file",
    `// responsibility: ${fileData.responsibility}`,
    `// actor: ${fileData.actor}`,
    `// role: ${fileData.role}`,
    `// source_truth: ${fileData.source_truth || "implementation"}`,
  ];
  return lines;
}

/**
 * Find all warehouse:method blocks in file
 */
function findMethodBlocks(content) {
  const lines = content.split("\n");
  const blocks = [];
  let currentBlock = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("//") && trimmed.includes("warehouse:method")) {
      if (currentBlock) {
        blocks.push(currentBlock);
      }
      currentBlock = {
        startIdx: i,
        lines: [line],
        methodName: null,
      };
    } else if (currentBlock && trimmed.startsWith("//") && (trimmed.includes("responsibility:") || trimmed.includes("actor:") || trimmed.includes("role:") || trimmed.includes("source_truth:"))) {
      currentBlock.lines.push(line);
    } else if (currentBlock && (trimmed === "" || !trimmed.startsWith("//"))) {
      currentBlock.endIdx = i;

      // Try to extract function name from current line or next non-empty line
      let searchIdx = i;
      while (searchIdx < lines.length) {
        const searchLine = lines[searchIdx];
        const searchTrimmed = searchLine.trim();

        if (searchTrimmed !== "" && (searchLine.includes("function ") || searchLine.includes("const ") || searchLine.includes("let ") || searchLine.includes("var "))) {
          const match = searchLine.match(/(?:function|const|let|var)\s+(\w+)/);
          if (match) {
            currentBlock.methodName = match[1];
          }
          break;
        }
        searchIdx++;

        // Stop searching if we hit another comment block or function-like keyword pattern
        if (searchTrimmed.startsWith("//") || searchTrimmed.startsWith("/*") || (searchIdx - i) > 5) {
          break;
        }
      }

      blocks.push(currentBlock);
      currentBlock = null;
    } else if (currentBlock) {
      currentBlock.lines.push(line);
    }
  }

  if (currentBlock) {
    blocks.push(currentBlock);
  }

  return blocks;
}

/**
 * Generate warehouse:method comment block
 */
function generateMethodHeader(methodData) {
  const lines = [
    "// warehouse:method",
    `// responsibility: ${methodData.responsibility}`,
    `// actor: ${methodData.actor}`,
    `// role: ${methodData.role}`,
    `// source_truth: ${methodData.source_truth || "implementation"}`,
  ];
  return lines;
}

/**
 * Update file with new anchors
 */
function updateFileAnchors(filePath, fileContent, fileData, methodsData) {
  let content = fileContent;
  let changes = {
    fileUpdated: false,
    methodsUpdated: 0,
  };

  // Update file-level header
  const fileHeader = parseFileHeader(content);
  if (fileHeader.lines.length > 0) {
    const newFileLines = generateFileHeader(fileData);
    const oldFileLines = fileHeader.lines.filter((l) => !l.trim().startsWith("// warehouse:") && !l.trim().startsWith("// responsibility:") && !l.trim().startsWith("// actor:") && !l.trim().startsWith("// role:") && !l.trim().startsWith("// source_truth:"));

    // Replace the old header
    const contentLines = content.split("\n");
    contentLines.splice(fileHeader.startIdx, fileHeader.endIdx - fileHeader.startIdx, ...newFileLines);

    if (fileHeader.endIdx > fileHeader.startIdx + newFileLines.length && contentLines[fileHeader.startIdx + newFileLines.length]?.trim() === "") {
      // Keep blank line if it existed
    } else if (contentLines[fileHeader.startIdx + newFileLines.length]?.trim() !== "") {
      // Add blank line after header if missing
      contentLines.splice(fileHeader.startIdx + newFileLines.length, 0, "");
    }

    content = contentLines.join("\n");
    changes.fileUpdated = true;
  }

  // Update method-level headers
  // methodsData is a key-value object: methodName -> responsibility string
  const methodBlocks = findMethodBlocks(content);
  let offset = 0;

  for (const block of methodBlocks) {
    // Try to extract method name from the block
    let methodName = block.methodName;

    // If we still don't have a method name, try to extract from the next line after the block
    if (!methodName) {
      const contentLines = content.split("\n");
      const nextLineIdx = block.endIdx + offset + 1;
      if (nextLineIdx < contentLines.length) {
        const nextLine = contentLines[nextLineIdx];
        const match = nextLine.match(/(?:function|const|let|var)\s+(\w+)/);
        if (match) {
          methodName = match[1];
        }
      }
    }

    // Only update if we found this method in the taxonomy
    if (!methodName || !methodsData[methodName]) {
      continue;
    }

    const methodTaxonomy = methodsData[methodName];

    // Create method data with updated taxonomy (or default if it's just a string)
    const methodData = typeof methodTaxonomy === 'string' ? {
      responsibility: methodTaxonomy,
      actor: "method_implementation",
      role: "implementation",
      source_truth: "implementation",
    } : {
      responsibility: methodTaxonomy.responsibility,
      actor: methodTaxonomy.actor || "method_implementation",
      role: methodTaxonomy.role || "implementation",
      source_truth: methodTaxonomy.source_truth || "implementation",
    };

    const newMethodLines = generateMethodHeader(methodData);
    const contentLines = content.split("\n");

    // Replace method header lines
    const startIdx = block.startIdx + offset;
    const endIdx = startIdx + block.lines.length;

    contentLines.splice(startIdx, block.lines.length, ...newMethodLines);
    offset += newMethodLines.length - block.lines.length;

    // Remove blank line that appears AFTER method comment block if present
    if (contentLines[startIdx + newMethodLines.length] === "") {
      contentLines.splice(startIdx + newMethodLines.length, 1);
      offset -= 1;
    }

    // Do NOT add blank line after method header - function should follow directly
    content = contentLines.join("\n");
    changes.methodsUpdated += 1;
  }

  return { content, changes };
}

/**
 * Process all files
 */
function processFiles(taxonomyPath, dryRun, verbose) {
  const taxonomy = loadTaxonomy(taxonomyPath);
  const taxonomyIndex = buildTaxonomyIndex(taxonomy);

  const stats = {
    totalFiles: 0,
    filesFound: 0,
    filesUpdated: 0,
    filesSkipped: 0,
    totalAnchorsUpdated: 0,
    errors: [],
  };

  console.log("\n📋 Anchor Updater\n");
  console.log(`Taxonomy: ${taxonomyPath}`);
  console.log(`Project root: ${PROJECT_ROOT}`);
  if (dryRun) {
    console.log("⚠️  DRY RUN MODE - No files will be modified\n");
  } else {
    console.log("");
  }

  // Process each file in taxonomy
  for (const [normalizedPath, taxonomyData] of Object.entries(taxonomyIndex)) {
    stats.totalFiles += 1;

    const filePath = path.join(PROJECT_ROOT, normalizedPath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      if (verbose) {
        console.log(`⚠️  File not found: ${normalizedPath}`);
      }
      stats.filesSkipped += 1;
      continue;
    }

    stats.filesFound += 1;

    try {
      const fileContent = fs.readFileSync(filePath, "utf8");

      // Only process JavaScript files
      if (!filePath.endsWith(".js")) {
        if (verbose) {
          console.log(`⏭️  Skipping non-JS file: ${normalizedPath}`);
        }
        stats.filesSkipped += 1;
        continue;
      }

      const { content: updatedContent, changes } = updateFileAnchors(filePath, fileContent, taxonomyData.file, taxonomyData.methods);

      if (changes.fileUpdated || changes.methodsUpdated > 0) {
        if (!dryRun) {
          fs.writeFileSync(filePath, updatedContent, "utf8");
        }

        stats.filesUpdated += 1;
        stats.totalAnchorsUpdated += (changes.fileUpdated ? 1 : 0) + changes.methodsUpdated;

        const status = dryRun ? "🔍" : "✅";
        const summary = [];
        if (changes.fileUpdated) summary.push("file");
        if (changes.methodsUpdated > 0) summary.push(`${changes.methodsUpdated} method${changes.methodsUpdated !== 1 ? "s" : ""}`);

        console.log(`${status} ${normalizedPath}`);
        if (verbose) {
          console.log(`   Updated: ${summary.join(", ")}`);
        }
      } else {
        stats.filesSkipped += 1;
        if (verbose) {
          console.log(`⏭️  No changes needed: ${normalizedPath}`);
        }
      }
    } catch (err) {
      stats.errors.push({
        file: normalizedPath,
        error: err.message,
      });
      console.log(`❌ Error processing ${normalizedPath}: ${err.message}`);
    }
  }

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Summary");
  console.log("=".repeat(60));
  console.log(`Files in taxonomy:     ${stats.totalFiles}`);
  console.log(`Files found on disk:   ${stats.filesFound}`);
  console.log(`Files updated:         ${stats.filesUpdated}`);
  console.log(`Files skipped:         ${stats.filesSkipped}`);
  console.log(`Total anchors updated: ${stats.totalAnchorsUpdated}`);

  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Errors: ${stats.errors.length}`);
    for (const { file, error } of stats.errors) {
      console.log(`  - ${file}: ${error}`);
    }
  }

  if (dryRun) {
    console.log("\n✅ Dry run complete - no files were modified");
  } else {
    console.log("\n✅ Anchor update complete!");
  }

  console.log("");

  return {
    success: stats.errors.length === 0,
    stats,
  };
}

/**
 * Main entry point
 */
function main() {
  try {
    const { taxonomyPath, dryRun, verbose } = parseArgs();
    const { success, stats } = processFiles(taxonomyPath, dryRun, verbose);

    process.exit(success ? 0 : 1);
  } catch (err) {
    console.error(`\n❌ Fatal error: ${err.message}\n`);
    console.error("Run 'node scripts/update-anchors.js --help' for usage information.\n");
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { updateFileAnchors, loadTaxonomy, buildTaxonomyIndex };
