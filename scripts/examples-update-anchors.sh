#!/bin/bash
# Examples: Using the Anchor Updater Script
#
# These are example commands showing common workflows.
# Copy and modify as needed for your use case.

# =============================================================================
# BASIC USAGE
# =============================================================================

# 1. Simple update from default taxonomy
echo "Example 1: Update from default taxonomy"
# node scripts/update-anchors.js

# 2. Update from custom taxonomy file
echo "Example 2: Update from custom taxonomy"
# node scripts/update-anchors.js --from reports/custom-taxonomy.json

# =============================================================================
# RECOMMENDED WORKFLOW
# =============================================================================

# 3. Dry-run first to see what would change (ALWAYS DO THIS FIRST)
echo "Example 3: Preview changes with dry-run"
# node scripts/update-anchors.js --dry-run

# 4. Dry-run with verbose output to see every file
echo "Example 4: Detailed preview"
# node scripts/update-anchors.js --dry-run --verbose

# 5. Apply the updates
echo "Example 5: Apply updates"
# node scripts/update-anchors.js

# 6. Verify the changes
echo "Example 6: Review what changed"
# git diff

# =============================================================================
# CI/CD INTEGRATION
# =============================================================================

# 7. Generate taxonomy, update, and verify
echo "Example 7: Full pipeline"
# set -e
# node bin/extract-taxonomy.js
# node scripts/update-anchors.js --dry-run
# node scripts/update-anchors.js
# node bin/audit-our-code.js

# =============================================================================
# TESTING
# =============================================================================

# 8. Run the test suite
echo "Example 8: Validate script logic"
# node scripts/test-update-anchors.js

# =============================================================================
# ADVANCED: FILTERED UPDATES
# =============================================================================

# 9. Update only specific directory (e.g., src/ only)
# First, create filtered taxonomy
# cat > /tmp/filter-taxonomy.js << 'EOF'
# const fs = require('fs');
# const path = require('path');
#
# const full = JSON.parse(fs.readFileSync('reports/taxonomy-extracted.json'));
# const filtered = {
#   ...full,
#   files: full.files.filter(f => f.path.startsWith('src/'))
# };
#
# fs.writeFileSync('reports/taxonomy-src-only.json', JSON.stringify(filtered, null, 2));
# console.log(`Created filtered taxonomy with ${filtered.files.length} files`);
# EOF
#
# node /tmp/filter-taxonomy.js
# node scripts/update-anchors.js --from reports/taxonomy-src-only.json --dry-run

# =============================================================================
# DEBUGGING
# =============================================================================

# 10. Troubleshoot with verbose output
echo "Example 10: Detailed debugging"
# node scripts/update-anchors.js --verbose 2>&1 | head -50

# 11. Check help
echo "Example 11: Show help"
# node scripts/update-anchors.js --help

# =============================================================================
# ROLLBACK (if something goes wrong)
# =============================================================================

# 12. Revert all changes
echo "Example 12: Rollback changes"
# git checkout .

# 13. Or restore specific file
echo "Example 13: Restore specific file"
# git checkout -- bin/analyze-story.js

# =============================================================================
# INTEGRATION WITH EXTRACTION
# =============================================================================

# 14. Extract taxonomy from current state, then update
echo "Example 14: Full sync cycle"
# node bin/extract-taxonomy.js
# node scripts/update-anchors.js --dry-run
# node scripts/update-anchors.js

# 15. Audit to verify all anchors are correct
echo "Example 15: Verify after update"
# node bin/audit-our-code.js

# =============================================================================
# PERFORMANCE TESTING
# =============================================================================

# 16. Time how long the update takes
echo "Example 16: Performance measurement"
# time node scripts/update-anchors.js

# 17. Check file sizes before/after
echo "Example 17: Size verification"
# du -sh . before update
# node scripts/update-anchors.js
# du -sh . after update

echo ""
echo "See UPDATE_ANCHORS_GUIDE.md for complete documentation."
