# Scripts Directory

Utility scripts for managing the multi-agent-studio project.

## Scripts

### `update-anchors.js` ⭐ Primary Script

Batch updates warehouse anchors in all source files from a taxonomy source.

**Usage:**
```bash
node scripts/update-anchors.js [options] [taxonomy-file]
```

**Key Features:**
- Reads expected taxonomy from JSON
- Updates file-level warehouse anchors
- Updates method-level warehouse anchors  
- Dry-run mode to preview changes
- Detailed reporting and error handling
- Production-ready with comprehensive error handling

**Quick Start:**
```bash
# Preview what would change
node scripts/update-anchors.js --dry-run --verbose

# Apply updates
node scripts/update-anchors.js

# Custom taxonomy
node scripts/update-anchors.js --from reports/custom-taxonomy.json
```

**Documentation:** See `UPDATE_ANCHORS_GUIDE.md`

---

### `test-update-anchors.js`

Test suite for the anchor updater. Validates logic without modifying files.

**Usage:**
```bash
node scripts/test-update-anchors.js
```

**Tests:**
- Load and parse taxonomy
- Build file index
- Update file anchors
- Update method anchors
- Handle missing headers
- Preserve file structure

---

### `examples-update-anchors.sh`

Example commands showing common workflows and use cases.

**Usage:**
```bash
bash scripts/examples-update-anchors.sh
```

Contains examples for:
- Basic usage patterns
- Dry-run workflow
- CI/CD integration
- Filtered updates
- Debugging and troubleshooting
- Rollback procedures

---

## Workflow Example

### 1. Generate Fresh Taxonomy
```bash
node bin/extract-taxonomy.js
```

### 2. Preview Changes
```bash
node scripts/update-anchors.js --dry-run --verbose
```

### 3. Apply Updates
```bash
node scripts/update-anchors.js
```

### 4. Verify
```bash
git diff
node bin/audit-our-code.js
```

---

## File Structure

```
scripts/
├── update-anchors.js              # Main anchor updater script
├── test-update-anchors.js         # Test suite
├── examples-update-anchors.sh     # Example commands
├── UPDATE_ANCHORS_GUIDE.md        # Complete documentation
└── README.md                      # This file
```

---

## Requirements

- Node.js 18.0.0 or later
- Bash (for example scripts)

---

## Quick Reference

| Task | Command |
|------|---------|
| Preview changes | `node scripts/update-anchors.js --dry-run` |
| Apply updates | `node scripts/update-anchors.js` |
| Verbose output | `node scripts/update-anchors.js --verbose` |
| Custom source | `node scripts/update-anchors.js --from FILE` |
| Run tests | `node scripts/test-update-anchors.js` |
| Show help | `node scripts/update-anchors.js --help` |
| See examples | `bash scripts/examples-update-anchors.sh` |

---

## Common Issues

**"No files updated"**
- Check taxonomy file exists
- Verify files have existing warehouse comments
- Use `--verbose` to see details

**"File not found"**
- Path is relative to project root
- Use absolute paths or check spelling

**"Method anchors not updating"**
- Methods matched by order in file
- Ensure taxonomy method order matches file order

---

## Integration Points

### With `extract-taxonomy.js`
```bash
node bin/extract-taxonomy.js
node scripts/update-anchors.js
```

### With `audit-our-code.js`
```bash
node scripts/update-anchors.js
node bin/audit-our-code.js
```

### With CI/CD
See `UPDATE_ANCHORS_GUIDE.md` for CI/CD examples.

---

## Support

For detailed information, see:
- `UPDATE_ANCHORS_GUIDE.md` - Complete documentation
- `examples-update-anchors.sh` - Example workflows
- `test-update-anchors.js` - Test suite and validation

For issues:
1. Run tests: `node scripts/test-update-anchors.js`
2. Try dry-run: `node scripts/update-anchors.js --dry-run --verbose`
3. Check git diff: `git diff`
4. Review anchor format in source files

---

## License

Part of multi-agent-studio project.
