#!/usr/bin/env node
// warehouse:file
// responsibility: Applies healing anchors to files specified in cleanup packet, extracting targets from phase-3-heal-valuable-modules
// actor: healing_executor
// role: packet_processor
// source_truth: packets/*-cleanup.json

/**
 * Heal anchors for valuable files missing proper taxonomy headers
 * Loads target files from a cleanup packet (JSON) and adds warehouse anchors
 *
 * Usage: node heal-anchors.js <packet.json>
 */

const fs = require('fs');
const path = require('path');

const packetPath = process.argv[2];
if (!packetPath) {
  console.error('Usage: node heal-anchors.js <packet.json>');
  console.error('Example: node heal-anchors.js packets/value-chain-cleanup.json');
  process.exit(1);
}

if (!fs.existsSync(packetPath)) {
  console.error(`❌ Packet file not found: ${packetPath}`);
  process.exit(1);
}

const packet = JSON.parse(fs.readFileSync(packetPath, 'utf8'));
const healPhase = packet.operations.find(op => op.name === 'phase-3-heal-valuable-modules');

if (!healPhase || !healPhase.target_files) {
  console.error('❌ Packet missing phase-3-heal-valuable-modules with target_files');
  process.exit(1);
}

const filesToHeal = healPhase.target_files;

let healed = 0;
let failed = 0;

for (const filePath of filesToHeal) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⏭️  ${filePath} - file not found, skipping`);
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');

    // Check if anchor already exists
    if (content.includes('// warehouse:file')) {
      console.log(`✅ ${filePath} - already has anchor`);
      healed++;
      continue;
    }

    // Derive minimal anchor from file path and structure
    const dir = path.dirname(filePath);
    const fileName = path.basename(filePath, '.js');
    const responsibility = `Provides core functionality for ${path.basename(dir)} module operations`;

    const newHeader = `// warehouse:file
// responsibility: ${responsibility}
// actor: module
// role: utility
// source_truth: implementation

`;

    const newContent = newHeader + content;
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✅ ${filePath} - anchor added`);
    healed++;
  } catch (error) {
    console.error(`❌ ${filePath} - ${error.message}`);
    failed++;
  }
}

console.log(`\n✅ Phase 3 Complete: ${healed} files healed, ${failed} failed`);
