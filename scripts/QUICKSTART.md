# Anchor Updater - Quick Start

Get started in 3 minutes.

## What is it?

A script that automatically updates warehouse anchors (responsibility, actor, role) in all source files based on a taxonomy JSON file.

## Installation

Already part of the project. Just run:

```bash
cd scripts/
```

## Quick Start (3 Steps)

### Step 1: Preview Changes (Safe!)
```bash
node scripts/update-anchors.js --dry-run
```

See what would change without modifying anything.

### Step 2: Apply Updates
```bash
node scripts/update-anchors.js
```

Updates all files from the taxonomy.

### Step 3: Verify
```bash
git diff
```

Review the changes.

Done! 🎉

## Common Commands

| Task | Command |
|------|---------|
| Preview changes | `node scripts/update-anchors.js --dry-run` |
| See details | `node scripts/update-anchors.js --dry-run --verbose` |
| Apply updates | `node scripts/update-anchors.js` |
| Run tests | `node scripts/test-update-anchors.js` |
| Get help | `node scripts/update-anchors.js --help` |
| Custom source | `node scripts/update-anchors.js --from FILE` |

## Workflow Example

```bash
# 1. Generate fresh taxonomy
node bin/extract-taxonomy.js

# 2. Preview changes
node scripts/update-anchors.js --dry-run --verbose

# 3. Apply updates
node scripts/update-anchors.js

# 4. Verify
git diff
node bin/audit-our-code.js

# 5. Commit
git add .
git commit -m "Update anchors"
```

## What It Updates

**File-level** (`warehouse:file`):
```javascript
// warehouse:file
// responsibility: What this file does
// actor: actor_name
// role: role_name
// source_truth: implementation
```

**Method-level** (`warehouse:method`):
```javascript
// warehouse:method
// responsibility: What this method does
// actor: actor_name
// role: role_name
// source_truth: implementation
function myMethod() { }
```

## Safety Features

✅ **Dry-run mode** - Preview without changes  
✅ **Verbose output** - See exactly what's happening  
✅ **Error handling** - Graceful failure messages  
✅ **Git-friendly** - Easy rollback with `git checkout`  

## Troubleshooting

### "Taxonomy file not found"
Check the path. Default is `reports/taxonomy-extracted.json`.

### "No files updated"
- Make sure files have existing warehouse comments
- Use `--verbose` to see details

### Undo changes
```bash
git checkout .
```

## Next Steps

- See `UPDATE_ANCHORS_GUIDE.md` for complete documentation
- See `examples-update-anchors.sh` for more examples
- See `README.md` for directory overview

## Questions?

- `node scripts/update-anchors.js --help` - Full help text
- `node scripts/test-update-anchors.js` - Run tests
- `cat scripts/UPDATE_ANCHORS_GUIDE.md` - Full documentation

---

**Ready to update your anchors?**

```bash
node scripts/update-anchors.js --dry-run
```

Then: `node scripts/update-anchors.js`
