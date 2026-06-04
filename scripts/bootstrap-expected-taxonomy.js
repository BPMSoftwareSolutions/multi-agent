#!/usr/bin/env node
// warehouse:file
// responsibility: Coordinates bootstrap expected taxonomy module behavior with documented file taxonomy evidence
// actor: maintenance_script
// role: implementation
// source_truth: implementation

const fs = require('fs');
const path = require('path');

// Read extracted taxonomy
const extracted = JSON.parse(fs.readFileSync('reports/taxonomy-extracted.json', 'utf8'));

// Transform into expected taxonomy format
const expected = {
  generated: new Date().toISOString(),
  files: extracted.files.map(file => ({
    path: file.path,
    responsibility: file.file.responsibility,
    actor: file.file.actor,
    role: file.file.role,
    source_truth: file.file.source_truth || 'implementation',
    methods: (file.methods || []).reduce((acc, m) => {
      if (m.name && m.taxonomy && m.taxonomy.responsibility) {
        acc[m.name] = m.taxonomy.responsibility;
      }
      return acc;
    }, {})
  }))
};

fs.writeFileSync('reports/expected-taxonomy.json', JSON.stringify(expected, null, 2), 'utf8');
console.log(`✅ Generated expected-taxonomy.json with ${expected.files.length} files`);
