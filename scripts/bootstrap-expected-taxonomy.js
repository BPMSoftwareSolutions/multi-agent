#!/usr/bin/env node
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
      acc[m.name] = m.responsibility;
      return acc;
    }, {})
  }))
};

fs.writeFileSync('reports/expected-taxonomy.json', JSON.stringify(expected, null, 2), 'utf8');
console.log(`✅ Generated expected-taxonomy.json with ${expected.files.length} files`);
