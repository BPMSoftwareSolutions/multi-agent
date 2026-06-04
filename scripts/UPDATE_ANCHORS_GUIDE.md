# Anchor Updater Script Guide

## Overview

The **Anchor Updater** (`update-anchors.js`) is a production-ready tool that reads taxonomy metadata from JSON and automatically updates all source files with new warehouse anchors. It ensures that file-level and method-level taxonomy comments stay synchronized with expected state.

## Features

- **Batch Update**: Updates all files from a single taxonomy source
- **Dual-Level**: Handles both file-level (`warehouse:file`) and method-level (`warehouse:method`) anchors
- **Dry-Run Mode**: Preview changes before applying them
- **Robust Error Handling**: Gracefully handles missing files, parse errors, and edge cases
- **Detailed Reporting**: Clear summary of what was updated and why
- **Verbose Mode**: Step-by-step progress for debugging
- **File Validation**: Only processes JavaScript files with existing anchors

## Installation

The script is already part of the project. No additional dependencies required beyond Node.js 18+.

## Usage

### Basic Usage

```bash
node scripts/update-anchors.js
```

This reads from the default taxonomy source (`reports/taxonomy-extracted.json`) and updates all files.

### With Custom Taxonomy File

```bash
node scripts/update-anchors.js --from reports/custom-taxonomy.json
```

Or with positional argument:

```bash
node scripts/update-anchors.js my-taxonomy.json
```

### Dry-Run Mode (Recommended First Step)

```bash
node scripts/update-anchors.js --dry-run
```

Shows exactly what would change without modifying any files.

### Verbose Mode

```bash
node scripts/update-anchors.js --verbose
```

Prints detailed progress for each file processed.

### Combined Options

```bash
node scripts/update-anchors.js --from reports/custom.json --dry-run --verbose
```

### Help

```bash
node scripts/update-anchors.js --help
```

## Taxonomy File Format

The script expects a JSON file with this structure:

```json
{
  "generated": "2026-06-04T12:09:05.658Z",
  "summary": {
    "totalFiles": 203,
    "totalMethods": 207
  },
  "files": [
    {
      "path": "bin/analyze-story.js",
      "file": {
        "warehouse": "file",
        "responsibility": "CLI entry point for story coherence analysis",
        "actor": "cli",
        "role": "orchestrator",
        "source_truth": "implementation"
      },
      "methods": [
        {
          "warehouse": "method",
          "responsibility": "Analyze story coherence and generate report",
          "actor": "report_generator",
          "role": "analyzer",
          "source_truth": "implementation"
        }
      ]
    }
  ]
}
```

## How It Works

### 1. Load & Index
- Reads the taxonomy JSON file
- Validates structure
- Builds an index for fast file lookup

### 2. Process Each File
For each file entry in the taxonomy:

- Check if file exists on disk
- Skip non-JavaScript files
- Read file content
- Parse existing warehouse anchors

### 3. Update Anchors

**File-Level Update:**
- Locate the `warehouse:file` comment block
- Replace `responsibility`, `actor`, `role`, `source_truth` fields
- Preserve shebang line (if present)
- Maintain blank line after header

**Method-Level Update:**
- Find all `warehouse:method` comment blocks
- Match them with methods in taxonomy (by order)
- Replace each method's metadata
- Ensure proper spacing

### 4. Write & Report
- Write updated content back to disk (unless `--dry-run`)
- Count changes per file
- Summarize results

## Expected Anchor Format

### File-Level Anchor

```javascript
// warehouse:file
// responsibility: Description of what this file does
// actor: actor_name
// role: role_name
// source_truth: implementation
```

### Method-Level Anchor

```javascript
// warehouse:method
// responsibility: What this function/method does
// actor: actor_name
// role: role_name
// source_truth: implementation
function myFunction() {
  // ...
}
```

Both file and method anchors are required to follow this exact format for proper parsing and updating.

## Output Example

```
📋 Anchor Updater

Taxonomy: reports/taxonomy-extracted.json
Project root: c:\source\repos\bpm\internal\multi-agent-studio

✅ bin/analyze-story.js
✅ bin/audit-our-code.js
✅ bin/continuous-snapshot.js
⏭️  Skipping non-JS file: docs/README.md
❌ Error processing src/broken.js: Unable to parse

============================================================
📊 Summary
============================================================
Files in taxonomy:     203
Files found on disk:   203
Files updated:         201
Files skipped:         2
Total anchors updated: 401

✅ Anchor update complete!
```

## Edge Cases Handled

### Missing Files
If a file is listed in taxonomy but not found on disk:
- Skipped automatically
- Logged in verbose mode
- Counted in skip statistics

### Missing Anchor Blocks
If a file doesn't have existing warehouse comments:
- File is skipped (only updates existing anchors)
- Logged if verbose mode enabled

### Multiple Methods
When a file has multiple methods:
- Methods are matched by order (1st method → 1st in taxonomy)
- Extra methods in taxonomy are ignored
- Unmatched methods in file are unchanged

### Non-JavaScript Files
Only `.js` files are processed, even if listed in taxonomy.

### Malformed Content
If file parsing fails:
- Error is caught and reported
- Process continues with next file
- File is not modified

## Performance

- **Speed**: Typically 1-2 seconds for 200+ files
- **Memory**: Efficient streaming (not loaded entirely)
- **Scaling**: Works with taxonomies of any size

## Rollback

If something goes wrong, you can rollback by running:

```bash
git checkout .
```

Or restore from your last commit.

## Testing

Run the test suite to validate the update logic:

```bash
node scripts/test-update-anchors.js
```

This runs unit tests without modifying any real files.

## Workflow Example

### Step 1: Generate fresh taxonomy
```bash
node bin/extract-taxonomy.js
```

### Step 2: Preview changes
```bash
node scripts/update-anchors.js --dry-run --verbose
```

### Step 3: Apply updates
```bash
node scripts/update-anchors.js
```

### Step 4: Verify
```bash
git diff
node bin/audit-our-code.js
```

## Common Issues

### "Taxonomy file not found"
- Check the path is correct
- Use absolute paths or paths relative to project root
- Default is `reports/taxonomy-extracted.json`

### "No files updated"
- Verify taxonomy has entries
- Check files exist on disk
- Ensure files have existing warehouse comments

### "Method anchors not updating"
- Method anchors are matched by order in file
- Taxonomy methods must be in same order as file
- Missing methods in file are skipped

## Advanced Usage

### Integration in CI/CD

```bash
#!/bin/bash
set -e

# Generate fresh taxonomy
node bin/extract-taxonomy.js

# Update all anchors
node scripts/update-anchors.js

# Verify no unexpected changes
git diff --exit-code || {
  echo "Anchors out of sync!"
  exit 1
}
```

### Partial Updates

To update only specific files, create a filtered taxonomy JSON:

```javascript
const full = JSON.parse(fs.readFileSync('reports/taxonomy-extracted.json'));
const filtered = {
  ...full,
  files: full.files.filter(f => f.path.startsWith('src/'))
};
fs.writeFileSync('filtered-taxonomy.json', JSON.stringify(filtered));
```

Then run:
```bash
node scripts/update-anchors.js --from filtered-taxonomy.json
```

## Troubleshooting

### Check file format
```bash
node scripts/test-update-anchors.js
```

### Enable verbose output
```bash
node scripts/update-anchors.js --verbose
```

### Validate taxonomy
```bash
node -e "console.log(require('fs').readFileSync('reports/taxonomy-extracted.json', 'utf8'))" | python -m json.tool
```

## Support

For issues or questions:
1. Check this guide
2. Run tests: `node scripts/test-update-anchors.js`
3. Try dry-run mode first
4. Review git diff for unexpected changes
