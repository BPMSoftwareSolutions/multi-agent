#!/usr/bin/env node
// warehouse:file
// responsibility: Coordinates cleanupLedgers behavior with documented file and method taxonomy evidence
// actor: maintenance_script
// role: implementation
// source_truth: implementation

/**
 * Cleanup Ledgers
 * Clears old worker-bee run ledgers to prevent stale data from polluting reports
 * This should run automatically before any new worker-bee execution
 */

const fs = require('fs');
const path = require('path');

const runsDir = path.resolve(__dirname, '..', 'reports', 'runs');

// warehouse:method
// responsibility: Coordinates cleanupLedgers behavior with documented file and method taxonomy evidence
// actor: method_implementation
// role: implementation
// source_truth: implementation
function cleanupLedgers() {
  try {
    if (fs.existsSync(runsDir)) {
      const entries = fs.readdirSync(runsDir);
      for (const entry of entries) {
        const fullPath = path.join(runsDir, entry);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          fs.rmSync(fullPath, { recursive: true, force: true });
        }
      }
    }
    console.log('✅ Ledger cleanup complete');
    return true;
  } catch (err) {
    console.error('❌ Ledger cleanup failed:', err.message);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  const success = cleanupLedgers();
  process.exit(success ? 0 : 1);
}

module.exports = { cleanupLedgers };
